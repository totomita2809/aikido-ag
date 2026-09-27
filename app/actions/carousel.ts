"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import {
    uploadEventImageToR2,
    buildEventFolderName,
    renameEventFolderOnR2,
    deleteEventFolderOnR2,
} from "@/lib/r2";

export interface CarouselImageItem {
    url: string;
    aspectRatio: "LANDSCAPE" | "PORTRAIT";
    fileName?: string;
}

export interface CreateCarouselInput {
    title: string;
    eventDate: string;
    description?: string;
    images: CarouselImageItem[];
}

export interface CarouselEventRecord {
    id: string;
    eventKey: string | null;
    title: string;
    eventDate: Date;
    description: string | null;
    imageUrl: string;
    aspectRatio: string;
    status: string;
    creatorId: string;
    creatorName: string;
    creatorRole: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ActionResponse {
    success: boolean;
    message: string;
    status?: string;
}

interface CarouselDelegate {
    create: (args: {
        data: {
            title: string;
            eventDate: Date;
            description: string | null;
            imageUrl: string;
            aspectRatio: string;
            status: string;
            eventKey: string;
            creatorId: string;
            creatorName: string;
            creatorRole: string;
        };
    }) => Promise<CarouselEventRecord>;
    findMany: (args: {
        where: { eventKey?: string; status?: string };
    }) => Promise<CarouselEventRecord[]>;
    update: (args: {
        where: { id: string };
        data: {
            title?: string;
            eventDate?: Date;
            description?: string | null;
            imageUrl?: string;
            status?: string;
        };
    }) => Promise<CarouselEventRecord>;
    updateMany: (args: {
        where: { eventKey: string };
        data: {
            title?: string;
            eventDate?: Date;
            description?: string | null;
            status?: string;
        };
    }) => Promise<{ count: number }>;
    deleteMany: (args: {
        where: { eventKey: string };
    }) => Promise<{ count: number }>;
}

function getCarouselDelegate(): CarouselDelegate {
    const delegate = (prisma as unknown as { carouselEvent?: CarouselDelegate }).carouselEvent;
    if (!delegate) {
        throw new Error("Model carouselEvent chưa được tạo hoặc chưa migrate trong Prisma Client.");
    }
    return delegate;
}

function parseDateInput(dateStr: string): Date {
    if (dateStr.includes("/")) {
        const [d, m, y] = dateStr.split("/");
        const day = Number(d);
        const month = Number(m);
        const year = Number(y);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month - 1, day);
        }
    }
    const fallbackDate = new Date(dateStr);
    return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
}

export async function getCurrentUserRole(): Promise<string | null> {
    const session = await getSession();
    return session?.role || null;
}

/**
 * 1. TẠO SỰ KIỆN MỚI
 */
export async function createCarouselEvent(data: CreateCarouselInput): Promise<ActionResponse> {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Vui lòng đăng nhập để thực hiện");
    }

    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const status = isSuperAdmin ? "APPROVED" : "PENDING_APPROVAL";

    const eventKey = crypto.randomBytes(3).toString("hex");
    const folderName = buildEventFolderName(data.title, data.eventDate, eventKey);
    const parsedEventDate = parseDateInput(data.eventDate);
    const carouselDelegate = getCarouselDelegate();

    if (data.images.length > 0) {
        let index = 1;
        for (const img of data.images) {
            let finalUrl = img.url;

            if (img.url.startsWith("data:")) {
                finalUrl = await uploadEventImageToR2(
                    img.url,
                    folderName,
                    img.fileName,
                    index++
                );
            }

            await carouselDelegate.create({
                data: {
                    title: data.title,
                    eventDate: parsedEventDate,
                    description: data.description || null,
                    imageUrl: finalUrl,
                    aspectRatio: img.aspectRatio,
                    status,
                    eventKey,
                    creatorId: session.userId,
                    creatorName: session.name || "Ban Huấn Luyện",
                    creatorRole: session.role,
                },
            });
        }
    }

    revalidatePath("/");
    revalidatePath("/exams");

    return {
        success: true,
        status,
        message: isSuperAdmin
            ? `Đã tạo và công khai sự kiện "${data.title}" lên website!`
            : `Đã gửi sự kiện "${data.title}", vui lòng chờ HLV Trưởng phê duyệt!`,
    };
}

/**
 * 2. CHỈNH SỬA TIÊU ĐỀ HOẶC NGÀY
 * - SUPER_ADMIN: Đổi trực tiếp trên R2 và Database ngay lập tức.
 * - COACH: Chỉ được đánh dấu PENDING_UPDATE để chờ HLV Trưởng duyệt.
 */
export async function updateCarouselEventInfo(
    eventKey: string,
    newTitle: string,
    newEventDateStr: string,
    newDescription?: string
): Promise<ActionResponse> {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Vui lòng đăng nhập để thực hiện");
    }

    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const carouselDelegate = getCarouselDelegate();
    const parsedEventDate = parseDateInput(newEventDateStr);

    if (!isSuperAdmin) {
        // Coach sửa -> Đưa vào hàng đợi duyệt, không đổi thư mục R2 ngay
        await carouselDelegate.updateMany({
            where: { eventKey },
            data: {
                status: "PENDING_UPDATE",
                description: newDescription ? `[YÊU CẦU SỬA: ${newTitle} - ${newEventDateStr}] ${newDescription}` : undefined,
            },
        });
        revalidatePath("/");
        return {
            success: true,
            status: "PENDING_UPDATE",
            message: "Yêu cầu chỉnh sửa đã được gửi tới HLV Trưởng phê duyệt.",
        };
    }

    // SUPER_ADMIN (HLV Trưởng) -> Đổi tên thư mục trên R2 và cập nhật URL
    const newFolderName = buildEventFolderName(newTitle, newEventDateStr, eventKey);
    const updatedFiles = await renameEventFolderOnR2(eventKey, newFolderName);

    const events = await carouselDelegate.findMany({ where: { eventKey } });

    for (const ev of events) {
        const currentFileName = ev.imageUrl.split("/").pop();
        const match = currentFileName
            ? updatedFiles.find((f) => f.oldKey.endsWith(`/${currentFileName}`))
            : undefined;

        await carouselDelegate.update({
            where: { id: ev.id },
            data: {
                title: newTitle,
                eventDate: parsedEventDate,
                description: newDescription !== undefined ? newDescription : ev.description,
                imageUrl: match ? match.newUrl : ev.imageUrl,
                status: "APPROVED",
            },
        });
    }

    revalidatePath("/");
    revalidatePath("/exams");

    return {
        success: true,
        status: "APPROVED",
        message: `Đã đổi tên thư mục Cloud R2 thành: ${newFolderName}`,
    };
}

/**
 * 3. XÓA SỰ KIỆN
 * - SUPER_ADMIN: Xoá vĩnh viễn trên R2 và Database không thể hoàn tác.
 * - COACH: Chỉ được gửi yêu cầu xóa (PENDING_DELETE).
 */
export async function deleteCarouselEvent(eventKey: string): Promise<ActionResponse> {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Vui lòng đăng nhập để thực hiện");
    }

    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const carouselDelegate = getCarouselDelegate();

    if (!isSuperAdmin) {
        await carouselDelegate.updateMany({
            where: { eventKey },
            data: { status: "PENDING_DELETE" },
        });
        revalidatePath("/");
        return {
            success: true,
            status: "PENDING_DELETE",
            message: "Đã gửi yêu cầu xóa sự kiện tới HLV Trưởng phê duyệt.",
        };
    }

    // SUPER_ADMIN: Xóa vĩnh viễn không thể khôi phục
    await deleteEventFolderOnR2(eventKey);
    await carouselDelegate.deleteMany({
        where: { eventKey },
    });

    revalidatePath("/");
    revalidatePath("/exams");

    return {
        success: true,
        message: "Đã xóa vĩnh viễn sự kiện và dọn sạch thư mục trên Cloudflare R2!",
    };
}

/**
 * 4. PHÊ DUYỆT SỰ KIỆN (Chỉ dành riêng cho HLV Trưởng - SUPER_ADMIN)
 */
export async function approveCarouselEvent(eventKey: string): Promise<ActionResponse> {
    const session = await getSession();
    if (session?.role !== "SUPER_ADMIN") {
        throw new Error("Chỉ có HLV Trưởng mới có quyền duyệt sự kiện.");
    }

    const carouselDelegate = getCarouselDelegate();
    await carouselDelegate.updateMany({
        where: { eventKey },
        data: { status: "APPROVED" },
    });

    revalidatePath("/");
    revalidatePath("/exams");

    return {
        success: true,
        message: "HLV Trưởng đã phê duyệt sự kiện hiển thị công khai!",
    };
}
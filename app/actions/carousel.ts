"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import {
    uploadEventImageToR2,
    buildEventFolderName,
    deleteEventFolderOnR2,
    getPresignedUploadUrl,
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

// Kiểu dữ liệu phục vụ Direct Upload
export interface PresignedRequestItem {
    clientTempId: string;
    fileName: string;
    aspectRatio: "LANDSCAPE" | "PORTRAIT";
}

export interface PresignedResponseItem {
    clientTempId: string;
    uploadUrl: string;
    publicUrl: string;
    aspectRatio: "LANDSCAPE" | "PORTRAIT";
}

export interface DirectSaveImageItem {
    url: string;
    aspectRatio: "LANDSCAPE" | "PORTRAIT";
}

export interface DirectSaveEventInput {
    title: string;
    eventDate: string;
    description?: string;
    eventKey: string;
    images: DirectSaveImageItem[];
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
    createMany: (args: {
        data: Array<{
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
        }>;
    }) => Promise<{ count: number }>;
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
        where: { eventKey?: string; imageUrl?: string };
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
 * BƯỚC 1 (DIRECT UPLOAD): XIN DANH SÁCH PRESIGNED URL TỪ R2
 * Chạy siêu nhẹ trên Vercel, trả về URL ký trước để client tự đẩy file lên R2.
 */
export async function getUploadPresignedUrls(
    title: string,
    eventDate: string,
    files: PresignedRequestItem[]
): Promise<{ eventKey: string; items: PresignedResponseItem[] }> {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Vui lòng đăng nhập để thực hiện");
    }

    const eventKey = crypto.randomBytes(3).toString("hex");
    const folderName = buildEventFolderName(title, eventDate, eventKey);

    const items: PresignedResponseItem[] = [];
    let idx = 1;

    for (const f of files) {
        const cleanName = f.fileName
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9-_]/g, "_");
        const key = `${folderName}/${idx++}_${cleanName}.webp`;
        const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, "image/webp");

        items.push({
            clientTempId: f.clientTempId,
            uploadUrl,
            publicUrl,
            aspectRatio: f.aspectRatio,
        });
    }

    return { eventKey, items };
}

/**
 * BƯỚC 2 (DIRECT UPLOAD): LƯU SỰ KIỆN VÀO DATABASE
 * Sau khi client đã tải trực tiếp toàn bộ ảnh lên R2 thành công.
 */
export async function createCarouselEventWithDirectUrls(
    data: DirectSaveEventInput
): Promise<ActionResponse> {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Vui lòng đăng nhập để thực hiện");
    }

    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const status = isSuperAdmin ? "APPROVED" : "PENDING_APPROVAL";
    const parsedEventDate = parseDateInput(data.eventDate);
    const carouselDelegate = getCarouselDelegate();

    await carouselDelegate.createMany({
        data: data.images.map((img) => ({
            title: data.title,
            eventDate: parsedEventDate,
            description: data.description || null,
            imageUrl: img.url,
            aspectRatio: img.aspectRatio,
            status,
            eventKey: data.eventKey,
            creatorId: session.userId,
            creatorName: session.name || "Ban Huấn Luyện",
            creatorRole: session.role,
        })),
    });

    revalidatePath("/");
    revalidatePath("/exams");

    return {
        success: true,
        status,
        message: isSuperAdmin
            ? `Đã tải ${data.images.length} hình ảnh lên Cloudflare R2 và đăng thành công!`
            : `Đã gửi ${data.images.length} hình ảnh, vui lòng chờ HLV Trưởng phê duyệt!`,
    };
}

/**
 * TẠO SỰ KIỆN MỚI (Hàm cũ - vẫn giữ để tương thích nếu cần)
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
 * CHỈNH SỬA TIÊU ĐỀ, NGÀY HOẶC MÔ TẢ SỰ KIỆN
 * Tối ưu hóa: Cập nhật trực tiếp Database, phản hồi tức thì 0.1s không bị treo Vercel
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
        await carouselDelegate.updateMany({
            where: { eventKey },
            data: {
                status: "PENDING_UPDATE",
                description: newDescription
                    ? `[YÊU CẦU SỬA: ${newTitle} - ${newEventDateStr}] ${newDescription}`
                    : undefined,
            },
        });
        revalidatePath("/");
        revalidatePath("/exams");
        return {
            success: true,
            status: "PENDING_UPDATE",
            message: "Yêu cầu chỉnh sửa đã được gửi tới HLV Trưởng phê duyệt.",
        };
    }

    // SUPER_ADMIN: Cập nhật trực tiếp các bản ghi trong Database
    await carouselDelegate.updateMany({
        where: { eventKey },
        data: {
            title: newTitle,
            eventDate: parsedEventDate,
            description: newDescription !== undefined ? newDescription : null,
            status: "APPROVED",
        },
    });

    revalidatePath("/");
    revalidatePath("/exams");

    return {
        success: true,
        status: "APPROVED",
        message: "Đã cập nhật thông tin sự kiện thành công!",
    };
}

/**
 * XÓA TỪNG ẢNH ĐƠN LẺ CỦA SỰ KIỆN (Dùng khi vào modal sửa để bỏ bớt ảnh)
 */
export async function deleteSingleCarouselImage(imageUrl: string): Promise<ActionResponse> {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Vui lòng đăng nhập để thực hiện");
    }

    const carouselDelegate = getCarouselDelegate();
    await carouselDelegate.deleteMany({
        where: { imageUrl },
    });

    revalidatePath("/");
    revalidatePath("/exams");

    return {
        success: true,
        message: "Đã xóa ảnh khỏi sự kiện!",
    };
}

/**
 * XÓA TOÀN BỘ SỰ KIỆN
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
 * PHÊ DUYỆT SỰ KIỆN (Chỉ dành riêng cho HLV Trưởng - SUPER_ADMIN)
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
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Môn sinh gửi yêu cầu cập nhật ảnh (lưu vào pendingAvatar)
export async function requestAvatarUpdate(studentId: string, base64Image: string) {
    const db = prisma as unknown as {
        student: {
            update: (args: unknown) => Promise<unknown>;
        };
    };

    await db.student.update({
        where: { id: studentId },
        data: {
            pendingAvatar: base64Image,
            avatarStatus: "PENDING",
        },
    });

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/admin/pending-avatars");
    return { success: true };
}

// 2. Admin bấm DUYỆT ảnh thẻ
export async function approveAvatar(studentId: string) {
    const db = prisma as unknown as {
        student: {
            findUnique: (args: unknown) => Promise<{ pendingAvatar: string | null } | null>;
            update: (args: unknown) => Promise<unknown>;
        };
    };

    const student = await db.student.findUnique({
        where: { id: studentId },
        select: { pendingAvatar: true },
    });

    if (!student?.pendingAvatar) return { success: false, error: "Không tìm thấy ảnh chờ duyệt" };

    await db.student.update({
        where: { id: studentId },
        data: {
            avatar: student.pendingAvatar,
            pendingAvatar: null,
            avatarStatus: "APPROVED",
        },
    });

    revalidatePath("/admin/pending-avatars");
    revalidatePath("/attendance");
    revalidatePath("/");
    return { success: true };
}

// 3. Admin bấm TỪ CHỐI ảnh thẻ
export async function rejectAvatar(studentId: string) {
    const db = prisma as unknown as {
        student: {
            update: (args: unknown) => Promise<unknown>;
        };
    };

    await db.student.update({
        where: { id: studentId },
        data: {
            pendingAvatar: null,
            avatarStatus: "REJECTED",
        },
    });

    revalidatePath("/admin/pending-avatars");
    return { success: true };
}

export async function getPendingAvatarCount(): Promise<number> {
    try {
        const db = prisma as unknown as {
            student: {
                count: (args: unknown) => Promise<number>;
            };
        };

        const count = await db.student.count({
            where: {
                avatarStatus: "PENDING",
                pendingAvatar: { not: null },
            },
        });
        return count;
    } catch {
        return 0;
    }
}
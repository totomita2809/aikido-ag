"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface UpdateStudentPayload {
    dateOfBirth?: string | Date | null;
    joinDate?: string | Date | null;
    title?: string | null;
    permissions?: Record<string, string>;
    [key: string]: unknown;
}

// 1. Phê duyệt hoặc từ chối ảnh thẻ
export async function handleAvatarApproval(
    studentId: string,
    action: "APPROVE" | "REJECT",
    reason?: string
) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Không có quyền thao tác");
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Không tìm thấy môn sinh");

    if (action === "APPROVE") {
        await prisma.student.update({
            where: { id: studentId },
            data: {
                avatar: student.pendingAvatar,
                pendingAvatar: null,
                avatarStatus: "APPROVED",
                rejectReason: null,
            },
        });
    } else {
        await prisma.student.update({
            where: { id: studentId },
            data: {
                pendingAvatar: null,
                avatarStatus: "REJECTED",
                rejectReason: reason || "Ảnh thẻ không hợp lệ",
            },
        });
    }

    revalidatePath("/admin/approvals");
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/");
}

// 2. Phê duyệt hoặc từ chối tạo mới môn sinh (do HLV thêm vào cần xét duyệt)
export async function handleCreationApproval(
    studentId: string,
    action: "APPROVE" | "REJECT",
    reason?: string,
    overridePermissions?: Record<string, string>
) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Không có quyền thao tác");
    }

    if (action === "APPROVE") {
        await prisma.student.update({
            where: { id: studentId },
            data: {
                approvalStatus: "APPROVED",
                rejectReason: null,
            },
        });

        if (overridePermissions) {
            await prisma.coachPermission.upsert({
                where: { studentId },
                update: overridePermissions,
                create: {
                    studentId,
                    ...overridePermissions,
                },
            });
        }
    } else {
        await prisma.student.update({
            where: { id: studentId },
            data: {
                approvalStatus: "REJECTED",
                rejectReason: reason || "Thông tin môn sinh không được phê duyệt",
            },
        });
    }

    revalidatePath("/admin/approvals");
    revalidatePath("/");
}

// 3. Phê duyệt hoặc từ chối yêu cầu chỉnh sửa thông tin
export async function handleEditApproval(
    changeId: string,
    action: "APPROVE" | "REJECT",
    reason?: string,
    overridePermissions?: Record<string, string>
) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Không có quyền thao tác");
    }

    const pendingChange = await prisma.pendingStudentChange.findUnique({
        where: { id: changeId },
    });

    if (!pendingChange) throw new Error("Không tìm thấy yêu cầu");

    if (action === "APPROVE") {
        const payload = JSON.parse(pendingChange.changedData) as UpdateStudentPayload;
        const { permissions, ...updateData } = payload;

        if (updateData.dateOfBirth && typeof updateData.dateOfBirth === "string") {
            updateData.dateOfBirth = new Date(updateData.dateOfBirth);
        }
        if (updateData.joinDate && typeof updateData.joinDate === "string") {
            updateData.joinDate = new Date(updateData.joinDate);
        }

        const finalPermissions = overridePermissions || permissions;

        await prisma.$transaction(async (tx) => {
            await tx.student.update({
                where: { id: pendingChange.studentId },
                data: updateData as Parameters<typeof tx.student.update>[0]["data"],
            });

            if (finalPermissions && updateData.title === "SHIDOIN") {
                await tx.coachPermission.upsert({
                    where: { studentId: pendingChange.studentId },
                    update: finalPermissions,
                    create: {
                        studentId: pendingChange.studentId,
                        ...finalPermissions,
                    },
                });
            }

            await tx.pendingStudentChange.update({
                where: { id: changeId },
                data: {
                    status: "APPROVED",
                    rejectReason: null,
                },
            });
        });
    } else {
        await prisma.pendingStudentChange.update({
            where: { id: changeId },
            data: {
                status: "REJECTED",
                rejectReason: reason || "Yêu cầu chỉnh sửa bị từ chối",
            },
        });
    }

    revalidatePath("/admin/approvals");
    revalidatePath(`/students/${pendingChange.studentId}`);
    revalidatePath("/");
}

// Polling kiểm tra danh sách task đang chờ duyệt
export async function getPendingApprovalTasks() {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") return [];

    const [avatars, creations, edits] = await Promise.all([
        prisma.student.findMany({
            where: { avatarStatus: "PENDING" },
            select: { id: true, fullName: true, studentCode: true, updatedAt: true },
        }),
        prisma.student.findMany({
            where: { approvalStatus: "PENDING_CREATION" },
            select: { id: true, fullName: true, studentCode: true, createdAt: true, creatorName: true },
        }),
        prisma.pendingStudentChange.findMany({
            where: { status: "PENDING" },
            select: { id: true, coachName: true, createdAt: true, student: { select: { fullName: true } } },
        }),
    ]);

    const tasks = [
        ...avatars.map((a) => ({
            id: a.id,
            title: `Ảnh thẻ mới: ${a.fullName} (${a.studentCode})`,
            time: new Date(a.updatedAt).getTime(),
        })),
        ...creations.map((c) => ({
            id: c.id,
            title: `Thêm mới: ${c.fullName} (${c.creatorName || "HLV"})`,
            time: new Date(c.createdAt).getTime(),
        })),
        ...edits.map((e) => ({
            id: e.id,
            title: `Sửa môn sinh: ${e.student.fullName} (từ ${e.coachName})`,
            time: new Date(e.createdAt).getTime(),
        })),
    ];

    return tasks;
}
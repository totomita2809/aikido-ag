"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface UpdateStudentPayload {
    dateOfBirth?: string | Date | null;
    joinDate?: string | Date | null;
    title?: string | null;
    fullName?: string | null;
    permissions?: Record<string, string>;
    [key: string]: unknown;
}

interface ApprovalResult {
    success: boolean;
    errors?: string[];
}

// 1. Phê duyệt hoặc từ chối ảnh thẻ
export async function handleAvatarApproval(
    studentId: string,
    action: "APPROVE" | "REJECT",
    reason?: string
): Promise<ApprovalResult> {
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
    return { success: true };
}

// 2. Phê duyệt hoặc từ chối tạo mới môn sinh (do HLV thêm vào cần xét duyệt)
export async function handleCreationApproval(
    studentId: string,
    action: "APPROVE" | "REJECT",
    reason?: string,
    overridePermissions?: Record<string, string>
): Promise<ApprovalResult> {
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
    return { success: true };
}

// 3. Phê duyệt hoặc từ chối yêu cầu chỉnh sửa thông tin (Kiểm tra thực tế Database và trả về chi tiết)
export async function handleEditApproval(
    changeId: string,
    action: "APPROVE" | "REJECT",
    reason?: string,
    overridePermissions?: Record<string, string>
): Promise<ApprovalResult> {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Không có quyền thao tác");
    }

    const pendingChange = await prisma.pendingStudentChange.findUnique({
        where: { id: changeId },
        include: {
            student: {
                select: { studentCode: true },
            },
        },
    });

    if (!pendingChange) throw new Error("Không tìm thấy yêu cầu");

    if (action === "REJECT") {
        await prisma.pendingStudentChange.update({
            where: { id: changeId },
            data: {
                status: "REJECTED",
                rejectReason: reason || "Yêu cầu chỉnh sửa bị từ chối",
            },
        });
        revalidatePath("/admin/approvals");
        revalidatePath(`/students/${pendingChange.studentId}`);
        revalidatePath("/");
        return { success: true };
    }

    const payload = JSON.parse(pendingChange.changedData) as UpdateStudentPayload;
    const { permissions, ...updateData } = payload;

    let parsedDateOfBirth: Date | undefined = undefined;
    if (updateData.dateOfBirth && typeof updateData.dateOfBirth === "string") {
        parsedDateOfBirth = new Date(updateData.dateOfBirth);
        updateData.dateOfBirth = parsedDateOfBirth;
    } else if (updateData.dateOfBirth instanceof Date) {
        parsedDateOfBirth = updateData.dateOfBirth;
    }

    if (updateData.joinDate && typeof updateData.joinDate === "string") {
        updateData.joinDate = new Date(updateData.joinDate);
    }

    const finalPermissions = overridePermissions || permissions;
    const studentCode = pendingChange.student?.studentCode || "";

    try {
        await prisma.$transaction(async (tx) => {
            await tx.student.update({
                where: { id: pendingChange.studentId },
                data: updateData as Parameters<typeof tx.student.update>[0]["data"],
            });

            const userUpdateData: { name?: string; username?: string; passwordHash?: string } = {};

            if (updateData.fullName && typeof updateData.fullName === "string") {
                userUpdateData.name = updateData.fullName;

                const cleanName = updateData.fullName.trim().toLowerCase().replace(/\s+/g, "");
                const nameParts = updateData.fullName.trim().split(/\s+/);
                const lastName = nameParts[0] ? nameParts[0].toLowerCase() : "";
                const firstName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : cleanName;

                if (studentCode) {
                    userUpdateData.username = `${lastName}${firstName}${studentCode.toLowerCase()}`.replace(/[^a-z0-9]/g, "");
                }
            }

            if (parsedDateOfBirth && !isNaN(parsedDateOfBirth.getTime())) {
                userUpdateData.passwordHash = parsedDateOfBirth.getFullYear().toString();
            }

            if (Object.keys(userUpdateData).length > 0) {
                await tx.user.updateMany({
                    where: { studentId: pendingChange.studentId },
                    data: userUpdateData,
                });
            }

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

        // KIỂM TRA LẠI DATABASE SAU KHI LƯU ĐỂ TRÁNH BÁO ẢO
        const verifiedStudent = await prisma.student.findUnique({
            where: { id: pendingChange.studentId },
        });

        const verificationErrors: string[] = [];
        if (verifiedStudent) {
            for (const [key, expectedVal] of Object.entries(updateData)) {
                if (key === "permissions") continue;
                const actualVal = (verifiedStudent as Record<string, unknown>)[key];

                if (expectedVal instanceof Date && actualVal instanceof Date) {
                    if (expectedVal.getTime() !== actualVal.getTime()) {
                        verificationErrors.push(`Trường [${key}] chưa khớp giá trị ngày tháng trên cơ sở dữ liệu.`);
                    }
                } else if (String(actualVal ?? "") !== String(expectedVal ?? "")) {
                    verificationErrors.push(`Trường [${key}] chưa được cập nhật (Mong đợi: "${expectedVal}", Thực tế trên DB: "${actualVal}").`);
                }
            }
        } else {
            verificationErrors.push("Không tìm thấy bản ghi môn sinh trên cơ sở dữ liệu sau khi duyệt.");
        }

        if (verificationErrors.length > 0) {
            return { success: false, errors: verificationErrors };
        }

        revalidatePath("/admin/approvals");
        revalidatePath(`/students/${pendingChange.studentId}`);
        revalidatePath("/");
        return { success: true };

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Lỗi hệ thống không xác định";
        return { success: false, errors: [`Lỗi ngoại lệ cơ sở dữ liệu: ${errorMessage}`] };
    }
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
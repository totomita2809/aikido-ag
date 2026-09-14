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

export interface DirectUpdateResult {
    success: boolean;
    status: "DIRECT_UPDATED";
    message: string;
    changes: string[];
}

// 4. Cập nhật trực tiếp dành cho SUPER_ADMIN không cần qua duyệt
export async function directUpdateStudentAction(
    studentId: string,
    updatedData: Record<string, unknown>
): Promise<DirectUpdateResult> {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Không có quyền thao tác trực tiếp");
    }

    const oldStudent = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true },
    });

    if (!oldStudent) {
        throw new Error("Không tìm thấy môn sinh");
    }

    const payload = { ...updatedData };
    let parsedDateOfBirth: Date | undefined = undefined;

    if (payload.dateOfBirth && typeof payload.dateOfBirth === "string") {
        parsedDateOfBirth = new Date(payload.dateOfBirth);
        payload.dateOfBirth = parsedDateOfBirth;
    } else if (payload.dateOfBirth instanceof Date) {
        parsedDateOfBirth = payload.dateOfBirth;
    }

    if (payload.joinDate && typeof payload.joinDate === "string") {
        payload.joinDate = new Date(payload.joinDate);
    }

    const { permissions, ...studentUpdateFields } = payload as UpdateStudentPayload & { permissions?: Record<string, string> };

    const changes: string[] = [];
    Object.keys(studentUpdateFields).forEach((key) => {
        const newVal = studentUpdateFields[key];
        const oldVal = (oldStudent as Record<string, unknown>)[key];
        const stringNew = newVal instanceof Date ? newVal.toISOString().split("T")[0] : String(newVal ?? "");
        const stringOld = oldVal instanceof Date ? oldVal.toISOString().split("T")[0] : String(oldVal ?? "");
        if (stringNew !== stringOld) {
            changes.push(`Mục [${key}]: "${stringOld || 'trống'}" ➔ "${stringNew || 'trống'}"`);
        }
    });

    const studentCode = oldStudent.studentCode || "";

    await prisma.$transaction(async (tx) => {
        await tx.student.update({
            where: { id: studentId },
            data: studentUpdateFields as Parameters<typeof tx.student.update>[0]["data"],
        });

        const userUpdateData: { name?: string; username?: string; passwordHash?: string } = {};

        if (studentUpdateFields.fullName && typeof studentUpdateFields.fullName === "string") {
            userUpdateData.name = studentUpdateFields.fullName;

            const cleanName = studentUpdateFields.fullName.trim().toLowerCase().replace(/\s+/g, "");
            const nameParts = studentUpdateFields.fullName.trim().split(/\s+/);
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
                where: { studentId },
                data: userUpdateData,
            });
        }

        if (permissions && studentUpdateFields.title === "SHIDOIN") {
            await tx.coachPermission.upsert({
                where: { studentId },
                update: permissions,
                create: {
                    studentId,
                    ...permissions,
                },
            });
        }
    });

    revalidatePath("/admin/approvals");
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/");

    return {
        success: true,
        status: "DIRECT_UPDATED",
        message: changes.length > 0
            ? `Super Admin đã cập nhật trực tiếp cơ sở dữ liệu. Các thay đổi:\n- ${changes.join("\n- ")}`
            : "Không có trường dữ liệu nào thay đổi.",
        changes,
    };
}

// 5. HLV gửi yêu cầu chỉnh sửa thông tin môn sinh
export async function requestStudentUpdateByCoach(
    studentId: string,
    updatedData: Record<string, unknown>
): Promise<ApprovalResult> {
    const session = await getSession();
    if (!session || (session.role !== "COACH" && session.role !== "SUPER_ADMIN")) {
        throw new Error("Không có quyền gửi yêu cầu chỉnh sửa");
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
        throw new Error("Không tìm thấy môn sinh");
    }

    const sessionRecord = session as Record<string, unknown>;
    const coachNameStr = typeof sessionRecord.name === "string"
        ? sessionRecord.name
        : typeof sessionRecord.username === "string"
            ? sessionRecord.username
            : "HLV";

    await prisma.pendingStudentChange.create({
        data: {
            studentId,
            coachName: coachNameStr,
            changedData: JSON.stringify(updatedData),
            status: "PENDING",
        },
    });

    revalidatePath("/admin/approvals");
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/");

    return { success: true };
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

// 3. Phê duyệt hoặc từ chối yêu cầu chỉnh sửa thông tin
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
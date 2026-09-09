"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Hàm hỗ trợ parse chuỗi ngày dd/MM/yyyy hoặc yyyy-MM-dd thành Date theo chuẩn UTC+7 (giờ VN)
function parseVNDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr || !dateStr.trim()) return null;
    const cleanStr = dateStr.trim();

    // 1. Định dạng dd/MM/yyyy
    if (cleanStr.includes("/")) {
        const parts = cleanStr.split("/");
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && parts[2].length === 4) {
                return new Date(Date.UTC(year, month, day, 0, 0, 0));
            }
        }
    }

    // 2. Định dạng yyyy-MM-dd
    const parsed = new Date(cleanStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

// Tự động kiểm tra database và cấp mã số kế tiếp bắt đầu từ 001 theo số đuôi lớn nhất trên TOÀN BỘ hệ thống (không trùng giữa các sân và HLV)
export async function getNextStudentCode(prefix: string): Promise<string> {
    const cleanPrefix = prefix.replace(/-$/, "").toUpperCase();

    const students = await prisma.student.findMany({
        select: {
            studentCode: true,
        },
    });

    let maxNumber = 0;
    for (const s of students) {
        const match = s.studentCode.match(/\d+$/);
        if (match && match[0]) {
            const num = parseInt(match[0], 10);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
            }
        }
    }

    const nextNum = maxNumber + 1;
    const padded = String(nextNum).padStart(3, "0");
    return `${cleanPrefix}-${padded}`;
}

export async function createStudent(formData: FormData) {
    const session = await getSession();
    if (!session) {
        throw new Error("Bạn chưa đăng nhập");
    }

    const title = (formData.get("title") as string) || "MEMBER";
    const dojoRaw = (formData.get("dojo") as string) || "HAYATE";
    // Nếu là Shidoin (HLV) thì luôn cố định phụ trách cả 2 sân
    const dojo = title === "SHIDOIN" ? "BOTH" : dojoRaw;

    const avatarRaw = formData.get("avatar") as string | null;
    const avatar = avatarRaw && avatarRaw.trim() !== "" ? avatarRaw.trim() : null;

    const fullName = formData.get("fullName") as string;
    const studentCodeRaw = (formData.get("studentCode") as string) || "";
    const dateOfBirthStr = formData.get("dateOfBirth") as string;
    const gender = formData.get("gender") as string;
    const phone = formData.get("phone") as string;
    const parentPhone = formData.get("parentPhone") as string;
    const emailRaw = formData.get("email") as string;
    const email = emailRaw && emailRaw.trim() !== "" ? emailRaw.trim() : null;
    const address = formData.get("address") as string;
    const currentRank = formData.get("currentRank") as string;
    const joinDateStr = formData.get("joinDate") as string;
    const healthNote = formData.get("healthNote") as string;

    if (!fullName || !studentCodeRaw) {
        throw new Error("Vui lòng điền đầy đủ họ tên và mã môn sinh");
    }

    const cleanCode = studentCodeRaw.trim().toUpperCase();

    // Tách phần số đuôi sau tiền tố HYT-, TC- hoặc HLV-
    const match = cleanCode.match(/\d+$/);
    const suffix = match ? match[0] : cleanCode.replace(/^(HYT-|TC-|HLV-)/, "");

    // Cấm trùng số đuôi trên toàn hệ thống (bất kể tiền tố HYT-, TC- hay HLV-)
    const existingStudent = await prisma.student.findFirst({
        where: {
            OR: [
                { studentCode: `HYT-${suffix}` },
                { studentCode: `TC-${suffix}` },
                { studentCode: `HLV-${suffix}` },
                { studentCode: cleanCode },
            ],
        },
    });

    if (existingStudent) {
        throw new Error(`Mã số "${suffix}" đã được sử dụng bởi môn sinh ${existingStudent.fullName} (${existingStudent.studentCode}). Vui lòng chọn số khác!`);
    }

    const dateOfBirth = parseVNDate(dateOfBirthStr);
    const joinDate = parseVNDate(joinDateStr) || new Date();

    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const approvalStatus = isSuperAdmin ? "APPROVED" : "PENDING_CREATION";

    // Tra cứu mã môn sinh của tài khoản đang tạo (nếu có)
    const currentCoach = await prisma.student.findFirst({
        where: { user: { id: session.userId } },
        select: { studentCode: true, fullName: true },
    });

    const studentData = {
        avatar,
        fullName,
        studentCode: cleanCode,
        dateOfBirth,
        gender: gender || "Nam",
        phone: phone || null,
        parentPhone: parentPhone ? parentPhone.trim() : null,
        email,
        address: address || null,
        healthNote: healthNote ? healthNote.trim() : null,
        dojo,
        currentRank: currentRank || "Đai trắng",
        joinDate,
        status: "ACTIVE",
        title,
        approvalStatus,
        creatorName: session.name || currentCoach?.fullName || "Huấn luyện viên",
        creatorCode: currentCoach?.studentCode || session.role,
    };

    const newStudent = await prisma.student.create({
        data: studentData,
    });

    if (title === "SHIDOIN" && isSuperAdmin) {
        await prisma.coachPermission.create({
            data: {
                studentId: newStudent.id,
                canCreateStudent: (formData.get("canCreateStudent") as string) || "VIEW",
                canEditFullName: (formData.get("canEditFullName") as string) || "VIEW",
                canEditRank: (formData.get("canEditRank") as string) || "VIEW",
                canEditDojo: (formData.get("canEditDojo") as string) || "VIEW",
                canEditDob: (formData.get("canEditDob") as string) || "VIEW",
                canEditGender: (formData.get("canEditGender") as string) || "VIEW",
                canEditPhone: (formData.get("canEditPhone") as string) || "VIEW",
                canEditAddress: (formData.get("canEditAddress") as string) || "VIEW",
                canEditHealth: (formData.get("canEditHealth") as string) || "VIEW",
                canEditStatus: (formData.get("canEditStatus") as string) || "VIEW",
            },
        });
    }

    revalidatePath("/students");
    revalidatePath("/admin/approvals");
    return { success: true, id: newStudent.id };
}

export async function updateStudent(id: string, formData: FormData) {
    const session = await getSession();
    if (!session) {
        throw new Error("Bạn chưa đăng nhập");
    }

    const title = formData.get("title") as string;
    const dojoRaw = (formData.get("dojo") as string) || "HAYATE";
    const dojo = title === "SHIDOIN" ? "BOTH" : dojoRaw;

    const avatarRaw = formData.get("avatar") as string | null;
    const avatar = avatarRaw && avatarRaw.trim() !== "" ? avatarRaw.trim() : null;

    const fullName = formData.get("fullName") as string;
    const studentCodeRaw = (formData.get("studentCode") as string) || "";
    const dateOfBirthStr = formData.get("dateOfBirth") as string;
    const gender = formData.get("gender") as string;
    const phone = formData.get("phone") as string;
    const parentPhone = formData.get("parentPhone") as string;
    const emailRaw = formData.get("email") as string;
    const email = emailRaw && emailRaw.trim() !== "" ? emailRaw.trim() : null;
    const address = formData.get("address") as string;
    const currentRank = formData.get("currentRank") as string;
    const joinDateStr = formData.get("joinDate") as string;
    const status = formData.get("status") as string;
    const healthNote = formData.get("healthNote") as string;

    const cleanCode = studentCodeRaw.trim().toUpperCase();

    // Tách phần số đuôi sau tiền tố HYT-, TC- hoặc HLV-
    const match = cleanCode.match(/\d+$/);
    const suffix = match ? match[0] : cleanCode.replace(/^(HYT-|TC-|HLV-)/, "");

    // Kiểm tra trùng số đuôi trên toàn hệ thống (loại trừ chính bản thân môn sinh đang sửa)
    const existingStudent = await prisma.student.findFirst({
        where: {
            id: { not: id },
            OR: [
                { studentCode: `HYT-${suffix}` },
                { studentCode: `TC-${suffix}` },
                { studentCode: `HLV-${suffix}` },
                { studentCode: cleanCode },
            ],
        },
    });

    if (existingStudent) {
        throw new Error(`Mã số "${suffix}" đã được sử dụng bởi môn sinh ${existingStudent.fullName} (${existingStudent.studentCode}). Vui lòng chọn số khác!`);
    }

    const dateOfBirth = parseVNDate(dateOfBirthStr);
    const joinDate = parseVNDate(joinDateStr);

    const updateData: Record<string, unknown> = {
        avatar,
        fullName,
        studentCode: cleanCode,
        dateOfBirth,
        gender: gender || "Nam",
        phone: phone || null,
        parentPhone: parentPhone ? parentPhone.trim() : null,
        email,
        address: address || null,
        healthNote: healthNote ? healthNote.trim() : null,
        dojo,
        currentRank: currentRank || "Đai trắng",
        status: status || "ACTIVE",
    };

    if (joinDate) {
        updateData.joinDate = joinDate;
    }

    if (title) {
        updateData.title = title;
    }

    const permissions = {
        canCreateStudent: (formData.get("canCreateStudent") as string) || "VIEW",
        canEditFullName: (formData.get("canEditFullName") as string) || "VIEW",
        canEditRank: (formData.get("canEditRank") as string) || "VIEW",
        canEditDojo: (formData.get("canEditDojo") as string) || "VIEW",
        canEditDob: (formData.get("canEditDob") as string) || "VIEW",
        canEditGender: (formData.get("canEditGender") as string) || "VIEW",
        canEditPhone: (formData.get("canEditPhone") as string) || "VIEW",
        canEditAddress: (formData.get("canEditAddress") as string) || "VIEW",
        canEditHealth: (formData.get("canEditHealth") as string) || "VIEW",
        canEditStatus: (formData.get("canEditStatus") as string) || "VIEW",
    };

    if (session.role === "SUPER_ADMIN") {
        await prisma.student.update({
            where: { id },
            data: updateData,
        });

        if (title === "SHIDOIN") {
            await prisma.coachPermission.upsert({
                where: { studentId: id },
                update: permissions,
                create: {
                    studentId: id,
                    ...permissions,
                },
            });
        }

        revalidatePath("/students");
        revalidatePath(`/students/${id}`);
        redirect(`/students/${id}`);
    }

    // Tra cứu mã môn sinh của Coach đang gửi yêu cầu
    const currentCoach = await prisma.student.findFirst({
        where: { user: { id: session.userId } },
        select: { studentCode: true, fullName: true },
    });

    const payload = {
        ...updateData,
        permissions: title === "SHIDOIN" ? permissions : null,
    };

    await prisma.pendingStudentChange.create({
        data: {
            studentId: id,
            coachId: session.userId,
            coachName: session.name || currentCoach?.fullName || "Huấn luyện viên",
            coachCode: currentCoach?.studentCode || "HLV",
            changedData: JSON.stringify(payload),
            status: "PENDING",
        },
    });

    revalidatePath("/admin/approvals");
    redirect("/students");
}

export async function deleteStudent(id: string) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Chỉ có HLV Trưởng mới có quyền xóa môn sinh");
    }

    await prisma.student.delete({
        where: { id },
    });

    revalidatePath("/students");
    redirect("/students");
}

export async function addRankHistory(studentId: string, formData: FormData) {
    const rank = formData.get("rank") as string;
    const examDateStr = formData.get("examDate") as string;
    const examiner = formData.get("examiner") as string;
    const certificateNo = formData.get("certificateNo") as string;
    const notes = formData.get("notes") as string;

    if (!rank) {
        throw new Error("Vui lòng chọn cấp đai thăng hạng");
    }

    const rankData = {
        studentId,
        rank,
        examDate: parseVNDate(examDateStr) || new Date(),
        examiner: examiner || "",
        certificateNo: certificateNo || "",
        notes: notes || "",
    };

    await prisma.rankHistory.create({
        data: rankData,
    });

    await prisma.student.update({
        where: { id: studentId },
        data: {
            currentRank: rank,
        },
    });

    revalidatePath("/students");
    revalidatePath(`/students/${studentId}`);
}

export async function requestStudentProfileUpdate(formData: FormData) {
    const session = await getSession();
    if (!session || !session.studentId) {
        throw new Error("Không tìm thấy thông tin môn sinh liên kết với tài khoản của bạn.");
    }

    const phone = formData.get("phone") as string;
    const parentPhone = formData.get("parentPhone") as string;
    const address = formData.get("address") as string;
    const avatar = formData.get("avatar") as string;

    const payload = {
        phone: phone ? phone.trim() : null,
        parentPhone: parentPhone ? parentPhone.trim() : null,
        address: address ? address.trim() : null,
        avatar: avatar ? avatar.trim() : null,
    };

    await prisma.pendingStudentChange.create({
        data: {
            studentId: session.studentId,
            coachId: session.userId,
            coachName: session.name || "Môn sinh",
            coachCode: "STUDENT_SELF",
            changedData: JSON.stringify(payload),
            status: "PENDING",
        },
    });

    revalidatePath("/admin/approvals");
    return { success: true };
}

export async function getStudentSelfProfile() {
    const session = await getSession();
    if (!session || !session.studentId) {
        return null;
    }

    const student = await prisma.student.findUnique({
        where: { id: session.studentId },
        select: {
            phone: true,
            parentPhone: true,
            address: true,
            avatar: true,
        },
    });

    return student;
}
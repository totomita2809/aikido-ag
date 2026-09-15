"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AIKIDO_RANKS, DOJO_CONFIGS } from "@/lib/constants";
import bcrypt from "bcryptjs";

// Hàm hỗ trợ parse chuỗi ngày dd/MM/yyyy hoặc yyyy-MM-dd thành Date theo chuẩn UTC+7 (giờ VN)
function parseVNDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr || !dateStr.trim()) return null;
    const cleanStr = dateStr.trim();

    // 1. Định dạng dd/MM/yyyy
    if (cleanStr.includes("/")) {
        const [dayStr, monthStr, yearStr] = cleanStr.split("/");
        if (dayStr && monthStr && yearStr && yearStr.length === 4) {
            const day = parseInt(dayStr, 10);
            const month = parseInt(monthStr, 10) - 1;
            const year = parseInt(yearStr, 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                return new Date(Date.UTC(year, month, day, 0, 0, 0));
            }
        }
    }

    // 2. Định dạng yyyy-MM-dd
    const parsed = new Date(cleanStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

// Hàm trích xuất quy tắc sinh tài khoản chuẩn hóa theo họ tên và mã môn sinh
function generateStudentCredentials(student: {
    fullName: string;
    studentCode: string;
    dateOfBirth?: Date | string | null;
}) {
    const cleanName = student.fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();

    const parts = cleanName.split(/\s+/).filter(Boolean);

    let namePrefix = "user";
    if (parts.length >= 3) {
        const ho = parts[0].replace(/[^a-z0-9]/g, "");
        const ten = parts[parts.length - 1].replace(/[^a-z0-9]/g, "");
        namePrefix = `${ho}${ten}`;
    } else if (parts.length === 2) {
        const ho = parts[0].replace(/[^a-z0-9]/g, "");
        const ten = parts[1].replace(/[^a-z0-9]/g, "");
        namePrefix = `${ho}${ten}`;
    } else if (parts.length === 1) {
        namePrefix = parts[0].replace(/[^a-z0-9]/g, "");
    }

    const matchCode = (student.studentCode || "").match(/\d+$/);
    const suffixNum = matchCode ? matchCode[0] : "001";
    const username = `${namePrefix}${suffixNum}`;

    const birthYear = student.dateOfBirth
        ? new Date(student.dateOfBirth).getFullYear().toString()
        : "2000";

    return {
        username,
        initialPassword: birthYear,
    };
}

// Tự động rà soát và tạo tài khoản đăng nhập (User) còn thiếu 
// cho những môn sinh (Student) trong cơ sở dữ liệu chưa được liên kết tài khoản nào.
export async function ensureMissingUsersAction() {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Không có quyền thực hiện");
    }

    const studentsWithoutUser = await prisma.student.findMany({
        where: {
            user: {
                is: null,
            },
        },
    });

    let createdCount = 0;
    for (const student of studentsWithoutUser) {
        const creds = generateStudentCredentials({
            fullName: student.fullName,
            studentCode: student.studentCode,
            dateOfBirth: student.dateOfBirth,
        });

        const username = creds.username;
        const passwordHash = await bcrypt.hash(creds.initialPassword, 10);
        const userEmail = student.email || `${username}@aikidoangiang.local`;

        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: userEmail },
                ],
            },
        });

        if (!existing && username) {
            await prisma.user.create({
                data: {
                    username,
                    email: userEmail,
                    name: student.fullName,
                    passwordHash,
                    role: student.title === "SHIDOIN" ? "COACH" : "STUDENT",
                    studentId: student.id,
                    mustChangePassword: true,
                },
            });
            createdCount++;
        }
    }

    revalidatePath("/students");
    return { success: true, createdCount };
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
    const dojoRaw = (formData.get("dojo") as string) || DOJO_CONFIGS.HAYATE.key;
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

    // Tách phần số đuôi sau tiền tố
    const match = cleanCode.match(/\d+$/);
    const suffix = match ? match[0] : cleanCode.replace(new RegExp(`^(${DOJO_CONFIGS.HAYATE.codePrefix}-|${DOJO_CONFIGS.TACHI.codePrefix}-|HLV-)`), "");

    // Cấm trùng số đuôi trên toàn hệ thống
    const existingStudent = await prisma.student.findFirst({
        where: {
            OR: [
                { studentCode: `${DOJO_CONFIGS.HAYATE.codePrefix}-${suffix}` },
                { studentCode: `${DOJO_CONFIGS.TACHI.codePrefix}-${suffix}` },
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
        currentRank: currentRank || AIKIDO_RANKS[0],
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

    const creds = generateStudentCredentials({
        fullName,
        studentCode: cleanCode,
        dateOfBirth,
    });

    const generatedUsername = creds.username;
    const userEmail = email || `${generatedUsername}@aikidoangiang.local`;

    let defaultPassword = creds.initialPassword;
    if (!dateOfBirth && phone && phone.trim() !== "") {
        defaultPassword = phone.trim();
    }

    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: userEmail },
                { username: generatedUsername },
            ],
        },
    });

    if (!existingUser) {
        await prisma.user.create({
            data: {
                username: generatedUsername,
                email: userEmail,
                name: fullName,
                passwordHash,
                role: title === "SHIDOIN" ? "COACH" : "STUDENT",
                studentId: newStudent.id,
                mustChangePassword: true,
            },
        });
    } else {
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                username: generatedUsername,
                email: userEmail,
                name: fullName,
                studentId: newStudent.id,
            },
        });
    }

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

    return {
        success: true,
        id: newStudent.id,
        account: {
            username: generatedUsername,
            email: userEmail,
            password: defaultPassword,
            fullName: fullName,
            studentCode: cleanCode,
        },
    };
}

export async function updateStudent(id: string, formData: FormData): Promise<{
    success: boolean;
    noChange?: boolean;
    message?: string;
}> {
    const session = await getSession();
    if (!session) {
        throw new Error("Bạn chưa đăng nhập");
    }

    // 1. Truy vấn đối chiếu dữ liệu gốc từ DB
    const currentStudent = await prisma.student.findUnique({
        where: { id },
        include: { coachPermission: true },
    });

    if (!currentStudent) {
        throw new Error("Không tìm thấy môn sinh");
    }

    const title = (formData.get("title") as string) || currentStudent.title || "MEMBER";
    const dojoRaw = (formData.get("dojo") as string) || currentStudent.dojo;
    const dojo = title === "SHIDOIN" ? "BOTH" : dojoRaw;

    // 2. Bảo toàn ảnh thẻ: Nếu không tải ảnh mới, giữ nguyên 100% ảnh cũ trong DB
    const avatarRaw = formData.get("avatar") as string | null;
    const avatar = avatarRaw && avatarRaw.trim() !== "" ? avatarRaw.trim() : currentStudent.avatar;

    const fullName = ((formData.get("fullName") as string) || currentStudent.fullName).trim();
    const studentCodeRaw = (formData.get("studentCode") as string) || currentStudent.studentCode;
    const cleanCode = studentCodeRaw.trim().toUpperCase();

    const dateOfBirthStr = formData.get("dateOfBirth") as string | null;
    const dateOfBirth = dateOfBirthStr ? parseVNDate(dateOfBirthStr) : currentStudent.dateOfBirth;

    const gender = (formData.get("gender") as string) || currentStudent.gender || "Nam";
    const phoneRaw = formData.get("phone") as string | null;
    const phone = phoneRaw && phoneRaw.trim() !== "" ? phoneRaw.trim() : null;

    const parentPhoneRaw = formData.get("parentPhone") as string | null;
    const parentPhone = parentPhoneRaw && parentPhoneRaw.trim() !== "" ? parentPhoneRaw.trim() : null;

    const emailRaw = formData.get("email") as string | null;
    const email = emailRaw && emailRaw.trim() !== "" ? emailRaw.trim() : null;

    const addressRaw = formData.get("address") as string | null;
    const address = addressRaw && addressRaw.trim() !== "" ? addressRaw.trim() : null;

    const currentRank = (formData.get("currentRank") as string) || currentStudent.currentRank;
    const status = (formData.get("status") as string) || currentStudent.status || "ACTIVE";

    const healthNoteRaw = formData.get("healthNote") as string | null;
    const healthNote = healthNoteRaw && healthNoteRaw.trim() !== "" ? healthNoteRaw.trim() : null;

    const joinDateStr = formData.get("joinDate") as string | null;
    const joinDate = joinDateStr ? (parseVNDate(joinDateStr) || currentStudent.joinDate) : currentStudent.joinDate;

    // Kiểm tra trùng số đuôi trên toàn hệ thống (nếu có thay đổi mã)
    if (cleanCode !== currentStudent.studentCode) {
        const match = cleanCode.match(/\d+$/);
        const suffix = match ? match[0] : cleanCode.replace(new RegExp(`^(${DOJO_CONFIGS.HAYATE.codePrefix}-|${DOJO_CONFIGS.TACHI.codePrefix}-|HLV-)`), "");

        const existingStudent = await prisma.student.findFirst({
            where: {
                id: { not: id },
                OR: [
                    { studentCode: `${DOJO_CONFIGS.HAYATE.codePrefix}-${suffix}` },
                    { studentCode: `${DOJO_CONFIGS.TACHI.codePrefix}-${suffix}` },
                    { studentCode: `HLV-${suffix}` },
                    { studentCode: cleanCode },
                ],
            },
        });

        if (existingStudent) {
            throw new Error(`Mã số "${suffix}" đã được sử dụng bởi môn sinh ${existingStudent.fullName} (${existingStudent.studentCode}). Vui lòng chọn số khác!`);
        }
    }

    const permissions: Record<string, string> = {
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

    // 3. So sánh dữ liệu để chặn spam lệnh nếu không có trường nào thay đổi
    const isDobSame = (currentStudent.dateOfBirth?.getTime() ?? null) === (dateOfBirth?.getTime() ?? null);
    const isJoinDateSame = (currentStudent.joinDate?.getTime() ?? null) === (joinDate?.getTime() ?? null);

    let isPermissionsSame = true;
    if (title === "SHIDOIN") {
        const oldPerms = currentStudent.coachPermission as Record<string, string> | null;
        if (!oldPerms) {
            isPermissionsSame = false;
        } else {
            isPermissionsSame = Object.keys(permissions).every((k) => permissions[k] === oldPerms[k]);
        }
    }

    const hasChanges =
        currentStudent.fullName !== fullName ||
        currentStudent.studentCode !== cleanCode ||
        currentStudent.avatar !== avatar ||
        currentStudent.gender !== gender ||
        (currentStudent.phone || null) !== phone ||
        (currentStudent.parentPhone || null) !== parentPhone ||
        (currentStudent.email || null) !== email ||
        (currentStudent.address || null) !== address ||
        currentStudent.currentRank !== currentRank ||
        currentStudent.status !== status ||
        (currentStudent.healthNote || null) !== healthNote ||
        currentStudent.dojo !== dojo ||
        currentStudent.title !== title ||
        !isDobSame ||
        !isJoinDateSame ||
        !isPermissionsSame;

    if (!hasChanges) {
        return {
            success: false,
            noChange: true,
            message: "Dữ liệu không có thay đổi nào so với hồ sơ hiện tại trên hệ thống.",
        };
    }

    const updateData = {
        avatar,
        fullName,
        studentCode: cleanCode,
        dateOfBirth,
        gender,
        phone,
        parentPhone,
        email,
        address,
        healthNote,
        dojo,
        currentRank,
        status,
        joinDate,
        title,
    };

    // TRƯỜNG HỢP 1: HLV TRƯỞNG (SUPER_ADMIN) CẬP NHẬT TRỰC TIẾP
    if (session.role === "SUPER_ADMIN") {
        await prisma.student.update({
            where: { id },
            data: updateData,
        });

        // Chỉ đồng bộ tài khoản User nếu có thay đổi trường định danh
        const isIdentityChanged =
            currentStudent.fullName !== fullName ||
            currentStudent.studentCode !== cleanCode ||
            currentStudent.email !== email ||
            currentStudent.title !== title ||
            !isDobSame;

        if (isIdentityChanged) {
            const creds = generateStudentCredentials({
                fullName,
                studentCode: cleanCode,
                dateOfBirth,
            });

            const userUpdatePayload: {
                name: string;
                username: string;
                email: string;
                role: string;
                passwordHash?: string;
            } = {
                name: fullName,
                username: creds.username,
                email: email || `${creds.username}@aikidoangiang.local`,
                role: title === "SHIDOIN" ? "COACH" : "STUDENT",
            };

            // Chỉ đặt lại mật khẩu theo năm sinh khi ngày sinh thực sự bị đổi
            if (!isDobSame && dateOfBirth) {
                userUpdatePayload.passwordHash = await bcrypt.hash(creds.initialPassword, 10);
            }

            await prisma.user.updateMany({
                where: { studentId: id },
                data: userUpdatePayload,
            });
        }

        if (title === "SHIDOIN") {
            await prisma.coachPermission.upsert({
                where: { studentId: id },
                update: permissions,
                create: {
                    studentId: id,
                    ...permissions,
                },
            });
        } else {
            await prisma.coachPermission.deleteMany({
                where: { studentId: id },
            });
        }

        revalidatePath("/students");
        revalidatePath(`/students/${id}`);
        return { success: true, message: "Đã cập nhật dữ liệu thành công!" };
    }

    // TRƯỜNG HỢP 2: HLV GỬI YÊU CẦU DUYỆT (CHƯA ĐỤNG ĐẾN DB CHÍNH & USER)
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
    return { success: true, message: "Đã gửi yêu cầu chỉnh sửa đến HLV Trưởng xét duyệt!" };
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

    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const parentPhone = formData.get("parentPhone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const gender = formData.get("gender") as string;
    const dateOfBirthStr = formData.get("dateOfBirth") as string;
    const healthNote = formData.get("healthNote") as string;
    const avatar = formData.get("avatar") as string;

    const payload = {
        fullName: fullName ? fullName.trim() : null,
        phone: phone ? phone.trim() : null,
        parentPhone: parentPhone ? parentPhone.trim() : null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        gender: gender ? gender.trim() : "Nam",
        dateOfBirth: parseVNDate(dateOfBirthStr),
        healthNote: healthNote ? healthNote.trim() : null,
        avatar: avatar ? avatar.trim() : null,
    };

    // Lấy thông tin HLV hiện tại (nếu có) để ghi nhận đúng người gửi
    const currentCoach = await prisma.student.findFirst({
        where: { user: { id: session.userId } },
        select: { studentCode: true, fullName: true },
    });

    await prisma.pendingStudentChange.create({
        data: {
            studentId: session.studentId,
            coachId: session.userId,
            coachName: session.name || currentCoach?.fullName || "Môn sinh",
            coachCode: session.role === "STUDENT" ? "" : (currentCoach?.studentCode || "HLV"),
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
            fullName: true,
            phone: true,
            parentPhone: true,
            address: true,
            avatar: true,
            currentRank: true,
            joinDate: true,
            dateOfBirth: true,
            gender: true,
            email: true,
            healthNote: true,
        },
    });

    return student;
}
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createSession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function login(prevState: { error?: string } | undefined, formData: FormData) {
    const username = (formData.get("username") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." };
    }

    const db = prisma as unknown as {
        user: {
            findFirst: (args: unknown) => Promise<{
                id: string;
                username: string | null;
                email: string | null;
                passwordHash: string | null;
                name: string | null;
                role: string;
                studentId?: string | null;
                mustChangePassword: boolean;
            } | null>;
        };
    };

    const user = await db.user.findFirst({
        where: {
            OR: [{ username }, { email: username }],
        },
    });

    if (!user || !user.passwordHash) {
        return { error: "Tài khoản hoặc mật khẩu không chính xác." };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        return { error: "Tài khoản hoặc mật khẩu không chính xác." };
    }

    await createSession({
        userId: user.id,
        username: user.username || user.email || "user",
        name: user.name || "Người dùng",
        role: (user.role as "SUPER_ADMIN" | "COACH" | "STUDENT") || "COACH",
        studentId: user.studentId,
        mustChangePassword: user.mustChangePassword,
    });

    revalidatePath("/students");
    revalidatePath("/");

    if (user.mustChangePassword) {
        redirect("/change-password");
    }

    if (user.role === "STUDENT" && user.studentId) {
        redirect("/students/me");
    } else {
        redirect("/students");
    }
}

export async function logout() {
    await deleteSession();
    revalidatePath("/");
    redirect("/login");
}

export interface ForgotPasswordResult {
    success: boolean;
    error?: string;
    noEmail?: boolean;
    username?: string;
    fullName?: string;
    studentCode?: string;
    message?: string;
}

export async function requestPasswordReset(formData: FormData): Promise<ForgotPasswordResult> {
    const identifier = formData.get("identifier") as string;
    if (!identifier || !identifier.trim()) {
        return { success: false, error: "Vui lòng nhập Tên đăng nhập hoặc Mã môn sinh." };
    }

    const cleanId = identifier.trim();

    const db = prisma as unknown as {
        user: {
            findFirst: (args: unknown) => Promise<{
                id: string;
                username: string | null;
                email: string | null;
                name: string | null;
                student?: {
                    fullName: string | null;
                    studentCode: string | null;
                    email: string | null;
                } | null;
            } | null>;
            update: (args: unknown) => Promise<unknown>;
        };
    };

    const user = await db.user.findFirst({
        where: {
            OR: [
                { username: cleanId },
                { student: { studentCode: cleanId } }
            ]
        },
        include: { student: true }
    });

    if (!user) {
        return { success: false, error: "Không tìm thấy tài khoản tương ứng trong hệ thống." };
    }

    const email = user.email || user.student?.email;

    if (!email) {
        return {
            success: false,
            noEmail: true,
            username: user.username || "Chưa có",
            fullName: user.name || user.student?.fullName || "Chưa cập nhật",
            studentCode: user.student?.studentCode || "Chưa có",
            message: "Tài khoản chưa đăng ký email. Yêu cầu đã được chuyển về cho Huấn luyện viên."
        };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    await db.user.update({
        where: { id: user.id },
        data: {
            resetToken: token,
            resetTokenExpiry: expiresAt,
        }
    });

    console.log(`[MAIL SERVICE] To: ${email} | Title: Aikido An Giang - Đổi Mật khẩu | Link: /reset-password?token=${token}`);

    return { success: true, message: "Đã gửi liên kết đổi mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư." };
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!token || !newPassword) {
        throw new Error("Thông tin không hợp lệ.");
    }

    const minLength = newPassword.length >= 6;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (VD: Tho1997@).");
    }

    const db = prisma as unknown as {
        user: {
            findFirst: (args: unknown) => Promise<{ id: string } | null>;
            update: (args: unknown) => Promise<unknown>;
        };
    };

    const user = await db.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: { gt: new Date() }
        }
    });

    if (!user) {
        throw new Error("Liên kết đổi mật khẩu không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực trong 1 giờ và dùng 1 lần).");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            mustChangePassword: false,
            resetToken: null,
            resetTokenExpiry: null,
        }
    });

    return { success: true, message: "Đổi mật khẩu thành công!" };
}
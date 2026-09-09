"use server";

import { prisma } from "@/lib/prisma";
import { getSession, deleteSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function changeFirstTimePassword(newPassword: string): Promise<{ success: boolean; message?: string }> {
    const session = await getSession();
    if (!session) {
        throw new Error("Chưa đăng nhập.");
    }

    // Kiểm tra tiêu chuẩn bảo mật mật khẩu mới
    const minLength = newPassword.length >= 6;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (VD: Tho1997@).");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const db = prisma as unknown as {
        user: {
            update: (args: unknown) => Promise<unknown>;
        };
    };

    await db.user.update({
        where: { id: session.userId },
        data: {
            passwordHash,
            mustChangePassword: false,
        },
    });

    // Xóa session cũ để yêu cầu đăng nhập lại với mật khẩu mới
    await deleteSession();

    revalidatePath("/login");
    return { success: true, message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại." };
}
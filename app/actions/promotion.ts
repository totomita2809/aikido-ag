"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface PromoteStudentParams {
    studentId: string;
    targetRank: string;
    notes?: string;
    isSpecialNomination?: boolean;
    attendanceCount: number;
    totalActiveMonths: number;
}

export async function promoteStudent({
    studentId,
    targetRank,
    notes,
    isSpecialNomination = false,
    attendanceCount,
    totalActiveMonths,
}: PromoteStudentParams): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
        const minRequiredPerMonth = 4;
        const averageAttendance = totalActiveMonths > 0 ? attendanceCount / totalActiveMonths : 0;

        if (!isSpecialNomination && averageAttendance < minRequiredPerMonth) {
            return {
                success: false,
                error: `Môn sinh chưa đủ điều kiện chuyên cần (tần suất tập trung bình dưới ${minRequiredPerMonth} buổi/tháng). Cần bật quyền Đặc cách của Super Admin!`,
            };
        }

        const db = prisma as unknown as {
            student: {
                update: (args: unknown) => Promise<unknown>;
            };
            rankHistory: {
                create: (args: unknown) => Promise<unknown>;
            };
        };

        // 1. Cập nhật cấp đai mới cho môn sinh
        await db.student.update({
            where: { id: studentId },
            data: {
                currentRank: targetRank,
            },
        });

        // 2. Ghi nhận vào sổ lưu Lịch sử thăng đai
        const finalNote = isSpecialNomination
            ? `[Đặc cách bởi Super Admin] ${notes || "Đạt chuẩn kỹ thuật & tố chất tốt"}`
            : notes || "Hoàn thành kỳ thi định kỳ";

        await db.rankHistory.create({
            data: {
                studentId,
                rank: targetRank,
                examDate: new Date(),
                examiner: "Ban Chuyên Môn / Super Admin",
                notes: finalNote,
            },
        });

        revalidatePath("/promotions");
        revalidatePath("/attendance");
        revalidatePath(`/students/${studentId}`);
        revalidatePath("/");

        return { success: true, message: "Phê duyệt thăng đai thành công!" };
    } catch (error) {
        console.error("Lỗi khi thăng đai:", error);
        return { success: false, error: "Không thể thực hiện thăng cấp" };
    }
}
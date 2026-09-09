"use server";

import { prisma } from "@/lib/prisma";

export async function uploadPaymentProof(studentId: string, month: number, year: number, base64Image: string): Promise<{ success: boolean; message: string }> {
    try {
        const existingFee = await prisma.tuitionFee.findFirst({
            where: { studentId, month, year },
        });

        if (!existingFee) {
            await prisma.tuitionFee.create({
                data: {
                    studentId,
                    month,
                    year,
                    amount: 300000,
                    isPaid: true,
                    paidAt: new Date(),
                    paymentMethod: "Chuyển khoản",
                    receiptUrl: base64Image,
                },
            });
        } else {
            await prisma.tuitionFee.update({
                where: { id: existingFee.id },
                data: {
                    isPaid: true,
                    paidAt: existingFee.paidAt || new Date(),
                    paymentMethod: "Chuyển khoản",
                    receiptUrl: base64Image,
                },
            });
        }

        return { success: true, message: "Tải ảnh biên lai thành công!" };
    } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        return { success: false, message: "Không thể tải lên hình ảnh." };
    }
}

export async function getPaymentProofs(studentId: string, month: number, year: number): Promise<{ id: string; imageUrl: string; createdAt: string }[]> {
    const feeRecord = await prisma.tuitionFee.findFirst({
        where: { studentId, month, year },
    });

    if (!feeRecord || !feeRecord.receiptUrl) return [];

    return [
        {
            id: feeRecord.id,
            imageUrl: feeRecord.receiptUrl,
            createdAt: feeRecord.paidAt ? new Date(feeRecord.paidAt).toLocaleDateString("vi-VN") : "—",
        },
    ];
}
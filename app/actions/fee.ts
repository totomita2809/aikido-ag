"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFeeStatus(formData: FormData): Promise<void> {
    const studentId = formData.get("studentId") as string;
    const month = Number(formData.get("month"));
    const year = Number(formData.get("year"));
    const amount = Number(formData.get("amount"));
    const currentStatus = formData.get("currentStatus") === "true";

    const newIsPaid = !currentStatus;
    const paidAt = newIsPaid ? new Date() : null;

    await prisma.tuitionFee.upsert({
        where: {
            studentId_month_year: {
                studentId,
                month,
                year,
            },
        },
        update: {
            isPaid: newIsPaid,
            paidAt,
        },
        create: {
            studentId,
            month,
            year,
            amount: amount || 300000,
            isPaid: newIsPaid,
            paidAt,
            paymentMethod: "Tiền mặt",
        },
    });

    revalidatePath("/fees");
}

export async function updateFeeDetails(formData: FormData): Promise<void> {
    const studentId = formData.get("studentId") as string;
    const month = Number(formData.get("month"));
    const year = Number(formData.get("year"));
    const amount = Number(formData.get("amount"));
    const isPaid = formData.get("isPaid") === "true";
    const paymentMethod = (formData.get("paymentMethod") as string) || "Tiền mặt";
    const paidAtRaw = formData.get("paidAt") as string;

    let paidAt: Date | null = null;
    if (isPaid) {
        paidAt = paidAtRaw ? new Date(paidAtRaw) : new Date();
    }

    await prisma.tuitionFee.upsert({
        where: {
            studentId_month_year: {
                studentId,
                month,
                year,
            },
        },
        update: {
            isPaid,
            paidAt,
            paymentMethod,
        },
        create: {
            studentId,
            month,
            year,
            amount: amount || 300000,
            isPaid,
            paidAt,
            paymentMethod,
        },
    });

    revalidatePath("/fees");
}
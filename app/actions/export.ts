"use server";

import { prisma } from "@/lib/prisma";

export async function exportStudentsCSV(dojo: string = "ALL"): Promise<string> {
    const students = await prisma.student.findMany({
        where: dojo !== "ALL" ? { dojo: dojo as unknown as "TACHI" | "HAYATE" } : undefined,
        orderBy: { studentCode: "asc" },
    });

    const headers = ["Mã Môn Sinh", "Họ Và Tên", "Sân Tập", "Giới Tính", "Ngày Sinh", "Số Điện Thoại"];
    const rows = students.map((s) => [
        s.studentCode,
        s.fullName,
        s.dojo === "TACHI" ? "Sân Tachi" : "Aikido Hayate",
        s.gender || "",
        s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString("vi-VN") : "",
        s.phone || "",
    ]);

    const csvContent = [
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return csvContent;
}

export async function exportTuitionFeesCSV(year: number, month?: number, dojo: string = "ALL"): Promise<string> {
    const students = await prisma.student.findMany({
        where: dojo !== "ALL" ? { dojo: dojo as unknown as "TACHI" | "HAYATE" } : undefined,
        orderBy: { studentCode: "asc" },
    });

    const studentIds = students.map((s) => s.id);

    // Truy vấn độc lập bảng học phí để tránh lỗi quan hệ Prisma
    const fees = await prisma.tuitionFee.findMany({
        where: {
            year,
            ...(month ? { month } : {}),
            studentId: { in: studentIds },
        },
    });

    const feeMap = new Map<string, typeof fees>();
    fees.forEach((f) => {
        const list = feeMap.get(f.studentId) || [];
        list.push(f);
        feeMap.set(f.studentId, list);
    });

    const headers = ["Mã Môn Sinh", "Họ Và Tên", "Sân Tập", "Tháng", "Năm", "Số Tiền (VND)", "Trạng Thái", "Ngày Đóng", "Hình Thức"];
    const rows: string[][] = [];

    students.forEach((student) => {
        const studentFees = feeMap.get(student.id) || [];
        if (studentFees.length > 0) {
            studentFees.forEach((fee) => {
                rows.push([
                    student.studentCode,
                    student.fullName,
                    student.dojo === "TACHI" ? "Sân Tachi" : "Aikido Hayate",
                    fee.month.toString(),
                    fee.year.toString(),
                    fee.amount.toString(),
                    fee.isPaid ? "Đã đóng" : "Chưa đóng",
                    fee.paidAt ? new Date(fee.paidAt).toLocaleDateString("vi-VN") : "—",
                    fee.paymentMethod || "—",
                ]);
            });
        } else {
            rows.push([
                student.studentCode,
                student.fullName,
                student.dojo === "TACHI" ? "Sân Tachi" : "Aikido Hayate",
                month ? month.toString() : "—",
                year.toString(),
                "300000",
                "Chưa đóng",
                "—",
                "—",
            ]);
        }
    });

    const csvContent = [
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return csvContent;
}
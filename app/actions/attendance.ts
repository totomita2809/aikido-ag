"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveBatchAttendance(formData: FormData) {
    const dateStr = formData.get("date") as string;
    const presentStudentIds = formData.getAll("presentIds") as string[];

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const db = prisma as unknown as {
        student: {
            findMany: (args: unknown) => Promise<{ id: string }[]>;
        };
        attendance: {
            upsert: (args: unknown) => Promise<unknown>;
        };
    };

    // Lấy toàn bộ môn sinh đang hoạt động (cả 2 sân)
    const allStudents = await db.student.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
    });

    const presentSet = new Set(presentStudentIds);

    await Promise.all(
        allStudents.map((s) => {
            const isPresent = presentSet.has(s.id);
            return db.attendance.upsert({
                where: {
                    studentId_date: {
                        studentId: s.id,
                        date,
                    },
                },
                update: {
                    status: isPresent ? "PRESENT" : "ABSENT",
                },
                create: {
                    studentId: s.id,
                    date,
                    status: isPresent ? "PRESENT" : "ABSENT",
                },
            });
        })
    );

    revalidatePath("/attendance");
}
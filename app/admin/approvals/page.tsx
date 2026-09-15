import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ApprovalsClient from "./ApprovalsClient";

export default async function ApprovalsPage() {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        redirect("/students");
    }

    const [pendingAvatars, pendingCreations, pendingEdits, pendingExams] = await Promise.all([
        prisma.student.findMany({
            where: { avatarStatus: "PENDING" },
            select: {
                id: true,
                studentCode: true,
                fullName: true,
                pendingAvatar: true,
                currentRank: true,
                dojo: true,
                updatedAt: true,
            },
        }),
        prisma.student.findMany({
            where: { approvalStatus: "PENDING_CREATION" },
            select: {
                id: true,
                studentCode: true,
                fullName: true,
                currentRank: true,
                dojo: true,
                phone: true,
                email: true,
                gender: true,
                dateOfBirth: true,
                joinDate: true,
                address: true,
                healthNote: true,
                title: true,
                creatorName: true,
                creatorCode: true,
                createdAt: true,
                coachPermission: true,
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.pendingStudentChange.findMany({
            where: { status: "PENDING" },
            select: {
                id: true,
                studentId: true,
                coachName: true,
                coachCode: true,
                changedData: true,
                createdAt: true,
                student: {
                    select: {
                        id: true,
                        studentCode: true,
                        fullName: true,
                        currentRank: true,
                        dojo: true,
                        phone: true,
                        email: true,
                        gender: true,
                        dateOfBirth: true,
                        joinDate: true,
                        address: true,
                        healthNote: true,
                        status: true,
                        title: true,
                        coachPermission: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.examSession.findMany({
            where: {
                candidates: {
                    some: {
                        resultStatus: "PENDING_APPROVAL",
                    },
                },
            },
            include: {
                examiners: true,
                candidates: {
                    include: {
                        student: true,
                    },
                },
            },
            orderBy: { examDate: "desc" },
        }),
    ]);

    return (
        <ApprovalsClient
            pendingAvatars={pendingAvatars}
            pendingCreations={pendingCreations as unknown as Parameters<typeof ApprovalsClient>[0]["pendingCreations"]}
            pendingEdits={pendingEdits as unknown as Parameters<typeof ApprovalsClient>[0]["pendingEdits"]}
            pendingExams={pendingExams as unknown as Parameters<typeof ApprovalsClient>[0]["pendingExams"]}
        />
    );
}
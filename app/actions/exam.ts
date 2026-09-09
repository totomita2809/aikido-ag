"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ExamDbClient {
    examSession: {
        create: (args: {
            data: {
                title: string;
                examDate: Date;
                dojo: string;
                headCoachPresent: boolean;
                examiners: {
                    create: Array<{
                        fullName: string;
                        rank: string;
                        role: string;
                        order: number;
                    }>;
                };
                candidates: {
                    create: Array<{
                        studentId: string;
                        targetRank: string;
                        isSpecial: boolean;
                        specialReason?: string;
                    }>;
                };
            };
        }) => Promise<{ id: string }>;
    };
}

export async function createExamSession(data: {
    title: string;
    examDate: string;
    dojo: string;
    headCoachPresent: boolean;
    examiners: Array<{
        fullName: string;
        rank: string;
        role: string;
        order: number;
    }>;
    candidates: Array<{
        studentId: string;
        targetRank: string;
        isSpecial: boolean;
        specialReason?: string;
    }>;
}) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Chỉ HLV Trưởng mới có quyền tạo kỳ thi");
    }

    const db = prisma as unknown as ExamDbClient;

    const createdExam = await db.examSession.create({
        data: {
            title: data.title,
            examDate: new Date(data.examDate),
            dojo: data.dojo,
            headCoachPresent: data.headCoachPresent,
            examiners: {
                create: data.examiners.map((ex) => ({
                    fullName: ex.fullName,
                    rank: ex.rank,
                    role: ex.role,
                    order: ex.order,
                })),
            },
            candidates: {
                create: data.candidates.map((cd) => ({
                    studentId: cd.studentId,
                    targetRank: cd.targetRank,
                    isSpecial: cd.isSpecial,
                    specialReason: cd.specialReason,
                })),
            },
        },
    });

    revalidatePath("/promotions");
    return { success: true, examId: createdExam.id };
}

export async function deleteExamSession(examId: string) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Chỉ HLV Trưởng mới có quyền xóa kỳ thi");
    }

    const db = prisma as unknown as {
        examSession: {
            delete: (args: { where: { id: string } }) => Promise<unknown>;
        };
    };

    await db.examSession.delete({
        where: { id: examId },
    });

    revalidatePath("/promotions");
    revalidatePath("/");
}

export async function updateExamSession(data: {
    examId: string;
    title: string;
    examDate: string;
    dojo: string;
    headCoachPresent: boolean;
    examiners: Array<{
        fullName: string;
        rank: string;
        role: string;
        order: number;
    }>;
    candidates: Array<{
        studentId: string;
        targetRank: string;
        isSpecial: boolean;
        specialReason?: string;
    }>;
}) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Chỉ HLV Trưởng mới có quyền chỉnh sửa kỳ thi");
    }

    const db = prisma as unknown as {
        examExaminer: {
            deleteMany: (args: { where: { examSessionId: string } }) => Promise<unknown>;
        };
        examCandidate: {
            deleteMany: (args: { where: { examSessionId: string } }) => Promise<unknown>;
        };
        examSession: {
            update: (args: {
                where: { id: string };
                data: {
                    title: string;
                    examDate: Date;
                    dojo: string;
                    headCoachPresent: boolean;
                    examiners: {
                        create: Array<{
                            fullName: string;
                            rank: string;
                            role: string;
                            order: number;
                        }>;
                    };
                    candidates: {
                        create: Array<{
                            studentId: string;
                            targetRank: string;
                            isSpecial: boolean;
                            specialReason?: string;
                        }>;
                    };
                };
            }) => Promise<{ id: string }>;
        };
    };

    await db.examExaminer.deleteMany({
        where: { examSessionId: data.examId },
    });
    await db.examCandidate.deleteMany({
        where: { examSessionId: data.examId },
    });

    await db.examSession.update({
        where: { id: data.examId },
        data: {
            title: data.title,
            examDate: new Date(data.examDate),
            dojo: data.dojo,
            headCoachPresent: data.headCoachPresent,
            examiners: {
                create: data.examiners.map((ex) => ({
                    fullName: ex.fullName,
                    rank: ex.rank,
                    role: ex.role,
                    order: ex.order,
                })),
            },
            candidates: {
                create: data.candidates.map((cd) => ({
                    studentId: cd.studentId,
                    targetRank: cd.targetRank,
                    isSpecial: cd.isSpecial,
                    specialReason: cd.specialReason,
                })),
            },
        },
    });

    revalidatePath("/promotions");
    revalidatePath("/");
    return { success: true };
}

// 1. Tự động lưu bản nháp theo thời gian thực (Realtime Auto-Save)
export async function autoSaveCandidateScores(data: {
    examId: string;
    candidateScores: Array<{
        candidateId: string;
        ukeCount: number;
        usedBonusScore?: number;
        overflowScore?: number;
        judgeScores: Array<{ examinerId: string; examinerName: string; score: number }>;
        finalScore: number;
        resultStatus: string;
        titleHonor?: string;
        notes?: string;
        promotedRank?: string;
    }>;
}) {
    const session = await getSession();
    if (!session) {
        throw new Error("Phiên đăng nhập đã hết hạn");
    }

    const db = prisma as unknown as {
        examCandidate: {
            update: (args: {
                where: { id: string };
                data: {
                    ukeCount: number;
                    usedBonusScore: number;
                    overflowScore: number;
                    judgeScores: unknown;
                    finalScore: number;
                    resultStatus: string;
                    titleHonor?: string | null;
                    notes?: string | null;
                    promotedRank?: string | null;
                };
            }) => Promise<unknown>;
        };
    };

    await Promise.all(
        data.candidateScores.map((c) =>
            db.examCandidate.update({
                where: { id: c.candidateId },
                data: {
                    ukeCount: c.ukeCount,
                    usedBonusScore: c.usedBonusScore || 0,
                    overflowScore: c.overflowScore || 0,
                    judgeScores: c.judgeScores,
                    finalScore: c.finalScore,
                    resultStatus: c.resultStatus,
                    titleHonor: c.titleHonor || null,
                    notes: c.notes || null,
                    promotedRank: c.promotedRank || null,
                },
            })
        )
    );

    return { success: true };
}

// 2. Lưu điểm thi chính thức kèm chuyển tiếp điểm dư vào hồ sơ môn sinh
export async function saveExamScoresWithCarryOver(data: {
    examId: string;
    examTitle: string;
    candidateScores: Array<{
        candidateId: string;
        studentId: string;
        ukeCount: number;
        usedBonusScore: number;
        overflowScore: number;
        judgeScores: Array<{ examinerId: string; examinerName: string; score: number }>;
        finalScore: number;
        resultStatus: string;
        titleHonor?: string;
        notes?: string;
        promotedRank?: string;
    }>;
}) {
    const session = await getSession();
    if (!session) {
        throw new Error("Phiên đăng nhập đã hết hạn");
    }

    const db = prisma as unknown as {
        $transaction: (queries: unknown[]) => Promise<unknown>;
        examCandidate: {
            update: (args: {
                where: { id: string };
                data: {
                    ukeCount: number;
                    usedBonusScore: number;
                    overflowScore: number;
                    judgeScores: unknown;
                    finalScore: number;
                    resultStatus: string;
                    titleHonor?: string | null;
                    notes?: string | null;
                    promotedRank?: string | null;
                };
            }) => unknown;
        };
        student: {
            update: (args: {
                where: { id: string };
                data: {
                    accumulatedBonusScore: number;
                    bonusScoreNote?: string | null;
                };
            }) => unknown;
        };
    };

    const queries: unknown[] = [];
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    for (const c of data.candidateScores) {
        queries.push(
            db.examCandidate.update({
                where: { id: c.candidateId },
                data: {
                    ukeCount: c.ukeCount,
                    usedBonusScore: c.usedBonusScore,
                    overflowScore: c.overflowScore,
                    judgeScores: c.judgeScores,
                    finalScore: c.finalScore,
                    resultStatus: c.resultStatus || "SUBMITTED",
                    titleHonor: c.titleHonor || null,
                    notes: c.notes || null,
                    promotedRank: c.promotedRank || null,
                },
            })
        );

        if (c.overflowScore > 0) {
            // Môn sinh có điểm vượt trần 10 -> bảo lưu sang kỳ thi sau
            queries.push(
                db.student.update({
                    where: { id: c.studentId },
                    data: {
                        accumulatedBonusScore: c.overflowScore,
                        bonusScoreNote: `Bảo lưu ${c.overflowScore} điểm dư từ "${data.examTitle}" (${dateStr})`,
                    },
                })
            );
        } else if (c.usedBonusScore > 0) {
            // Đã dùng điểm bảo lưu cũ ở kỳ này -> hoàn tất và làm mới về 0
            queries.push(
                db.student.update({
                    where: { id: c.studentId },
                    data: {
                        accumulatedBonusScore: 0,
                        bonusScoreNote: null,
                    },
                })
            );
        }
    }

    await db.$transaction(queries);
    revalidatePath("/promotions");
    return { success: true };
}

// 3. Phê duyệt & Chốt kỳ thi: HLV Trưởng duyệt kết quả và phong cấp đai
export async function finalizeExamWithBeltPromotion(data: {
    examId: string;
    promotions: Array<{
        candidateId: string;
        studentId: string;
        targetRank: string;
        assignedRank?: string; // Cấp đai thực tế HLV Trưởng chọn phong (tối đa Nâu 3)
        isPassed: boolean;
        finalScore: number;
        titleHonor?: string;
    }>;
}) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        throw new Error("Chỉ HLV Trưởng mới có quyền công nhận kỳ thi và phong thăng đai");
    }

    const db = prisma as unknown as {
        $transaction: (queries: unknown[]) => Promise<unknown>;
        examCandidate: {
            update: (args: {
                where: { id: string };
                data: {
                    resultStatus: string;
                    promotedRank?: string | null;
                    finalScore: number;
                    titleHonor?: string | null;
                };
            }) => unknown;
        };
        student: {
            update: (args: {
                where: { id: string };
                data: {
                    currentRank: string;
                };
            }) => unknown;
        };
    };

    const queries: unknown[] = [];

    for (const p of data.promotions) {
        const finalRankToPromote = p.assignedRank || p.targetRank;

        queries.push(
            db.examCandidate.update({
                where: { id: p.candidateId },
                data: {
                    resultStatus: p.isPassed ? "APPROVED" : "FAILED",
                    promotedRank: p.isPassed ? finalRankToPromote : null,
                    finalScore: p.finalScore,
                    titleHonor: p.titleHonor || null,
                },
            })
        );

        if (p.isPassed) {
            queries.push(
                db.student.update({
                    where: { id: p.studentId },
                    data: {
                        currentRank: finalRankToPromote,
                    },
                })
            );
        }
    }

    await db.$transaction(queries);
    revalidatePath("/promotions");
    revalidatePath("/");
    return { success: true };
}
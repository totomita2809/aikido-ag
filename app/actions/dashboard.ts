"use server";

import { prisma } from "@/lib/prisma";

interface RankStat {
    rank: string;
    count: number;
}

interface DashboardStats {
    totalActiveStudents: number;
    paidCount: number;
    unpaidCount: number;
    totalCollected: number;
    rankDistribution: RankStat[];
}

export async function getDashboardStats(currentMonth: number, currentYear: number): Promise<DashboardStats> {
    // 1. Tổng số môn sinh đang hoạt động
    const totalActiveStudents = await prisma.student.count({
        where: { status: "ACTIVE" },
    });

    // 2. Thống kê học phí trong tháng/năm được chọn
    const tuitionFees = await prisma.tuitionFee.findMany({
        where: {
            month: currentMonth,
            year: currentYear,
        },
        include: {
            student: {
                select: { dojo: true },
            },
        },
    });

    const paidCount = tuitionFees.filter((f) => f.isPaid).length;
    const unpaidCount = Math.max(0, totalActiveStudents - paidCount);

    // Tính tổng tiền thu thực tế từ các khoản đã đóng
    const totalCollected = tuitionFees
        .filter((f) => f.isPaid)
        .reduce((sum, f) => sum + f.amount, 0);

    // 3. Thống kê phân bổ cấp đai (Belt distribution)
    const allStudents = await prisma.student.findMany({
        where: { status: "ACTIVE" },
        select: { currentRank: true },
    });

    const rankMap: Record<string, number> = {};
    allStudents.forEach((s) => {
        const rank = s.currentRank || "Đai trắng";
        rankMap[rank] = (rankMap[rank] || 0) + 1;
    });

    const rankDistribution: RankStat[] = Object.entries(rankMap).map(([rank, count]) => ({
        rank,
        count,
    }));

    return {
        totalActiveStudents,
        paidCount,
        unpaidCount,
        totalCollected,
        rankDistribution,
    };
}
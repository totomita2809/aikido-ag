export interface RankRequirement {
    currentRank: string;
    nextRank: string;
    requiredDays: number;     // Thời gian tối thiểu (ngày)
    requiredSessions: number; // Số buổi tập tối thiểu
}

// 1. Toàn bộ danh mục cấp đai chính quy của võ đường (Đai trắng -> Đai đen 8 Đẳng)
export const AIKIDO_ALL_RANKS = [
    "Đai trắng",
    "Đai xanh 1 vạch",
    "Đai xanh 2 vạch",
    "Đai xanh 3 vạch",
    "Đai nâu 1 vạch",
    "Đai nâu 2 vạch",
    "Đai nâu 3 vạch",
    "Đai đen 1 Đẳng (Shodan)",
    "Đai đen 2 Đẳng (Nidan)",
    "Đai đen 3 Đẳng (Sandan)",
    "Đai đen 4 Đẳng (Yondan)",
    "Đai đen 5 Đẳng (Godan)",
    "Đai đen 6 Đẳng (Rokudan)",
    "Đai đen 7 Đẳng (Nanadan)",
    "Đai đen 8 Đẳng (Hachidan)",
] as const;

export type AikidoRank = (typeof AIKIDO_ALL_RANKS)[number];

// 2. Danh mục cấp đai được phép phong tặng nội bộ (Chặn trần ở Nâu 3)
export const PROMOTABLE_RANKS = [
    "Đai trắng",
    "Đai xanh 1 vạch",
    "Đai xanh 2 vạch",
    "Đai xanh 3 vạch",
    "Đai nâu 1 vạch",
    "Đai nâu 2 vạch",
    "Đai nâu 3 vạch",
] as const;

// 3. Thứ tự cấp đai để sắp xếp từ nhỏ đến lớn
export const RANK_ORDER: Record<string, number> = {
    "Đai trắng": 1,
    "Đai xanh 1 vạch": 2,
    "Đai xanh 2 vạch": 3,
    "Đai xanh 3 vạch": 4,
    "Đai nâu 1 vạch": 5,
    "Đai nâu 2 vạch": 6,
    "Đai nâu 3 vạch": 7,
    "Đai đen 1 Đẳng (Shodan)": 8,
    "Đai đen 2 Đẳng (Nidan)": 9,
    "Đai đen 3 Đẳng (Sandan)": 10,
    "Đai đen 4 Đẳng (Yondan)": 11,
    "Đai đen 5 Đẳng (Godan)": 12,
    "Đai đen 6 Đẳng (Rokudan)": 13,
    "Đai đen 7 Đẳng (Nanadan)": 14,
    "Đai đen 8 Đẳng (Hachidan)": 15,
};

export function getRankPriority(rank: string): number {
    const trimmed = rank.trim();
    return RANK_ORDER[trimmed] || 99;
}

// Kiểm tra xem môn sinh có đang dưới đai đen hay không (áp dụng bảo lưu điểm dư)
export function isUnderBlackBelt(rank: string): boolean {
    const priority = getRankPriority(rank);
    return priority < 8;
}

// 4. Quy định điều kiện thời gian & số buổi tập tối thiểu
export const RANK_REQUIREMENTS: Record<string, RankRequirement> = {
    "Đai trắng": {
        currentRank: "Đai trắng",
        nextRank: "Đai xanh 1 vạch",
        requiredDays: 90,
        requiredSessions: 30,
    },
    "Đai xanh 1 vạch": {
        currentRank: "Đai xanh 1 vạch",
        nextRank: "Đai xanh 2 vạch",
        requiredDays: 90,
        requiredSessions: 35,
    },
    "Đai xanh 2 vạch": {
        currentRank: "Đai xanh 2 vạch",
        nextRank: "Đai xanh 3 vạch",
        requiredDays: 120,
        requiredSessions: 40,
    },
    "Đai xanh 3 vạch": {
        currentRank: "Đai xanh 3 vạch",
        nextRank: "Đai nâu 1 vạch",
        requiredDays: 120,
        requiredSessions: 45,
    },
    "Đai nâu 1 vạch": {
        currentRank: "Đai nâu 1 vạch",
        nextRank: "Đai nâu 2 vạch",
        requiredDays: 150,
        requiredSessions: 50,
    },
    "Đai nâu 2 vạch": {
        currentRank: "Đai nâu 2 vạch",
        nextRank: "Đai nâu 3 vạch",
        requiredDays: 180,
        requiredSessions: 60,
    },
    "Đai nâu 3 vạch": {
        currentRank: "Đai nâu 3 vạch",
        nextRank: "Đai đen 1 Đẳng (Shodan)",
        requiredDays: 365,
        requiredSessions: 100,
    },
};

// Hàm hỗ trợ chuẩn hóa tên đai để tính toán
export function normalizeRankName(rank: string): string {
    const r = rank.toLowerCase().trim();
    if (r.includes("đen") || r.includes("shodan") || r.includes("dan")) return "Đai đen 1 Đẳng (Shodan)";
    if (r.includes("nâu 3") || r.includes("nau 3")) return "Đai nâu 3 vạch";
    if (r.includes("nâu 2") || r.includes("nau 2")) return "Đai nâu 2 vạch";
    if (r.includes("nâu 1") || r.includes("nau 1") || r.includes("nâu")) return "Đai nâu 1 vạch";
    if (r.includes("xanh 3")) return "Đai xanh 3 vạch";
    if (r.includes("xanh 2")) return "Đai xanh 2 vạch";
    if (r.includes("xanh 1") || r.includes("xanh")) return "Đai xanh 1 vạch";
    return "Đai trắng";
}

export function checkPromotionEligibility(
    currentRank: string,
    joinDate: Date,
    attendedSessions: number
) {
    const normalized = normalizeRankName(currentRank);

    if (normalized.includes("Đai đen")) {
        return {
            isEligible: false,
            nextRank: "Thi thăng Đẳng (Liên đoàn Aikido)",
            progressPercent: 100,
            daysActive: 0,
            requiredDays: 0,
            attendedSessions,
            requiredSessions: 0,
            isMaxRank: true,
        };
    }

    const req = RANK_REQUIREMENTS[normalized] || RANK_REQUIREMENTS["Đai trắng"];
    const now = new Date();
    const daysActive = Math.max(
        0,
        Math.floor((now.getTime() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    const daysProgress = Math.min(100, (daysActive / req.requiredDays) * 100);
    const sessionsProgress = Math.min(100, (attendedSessions / req.requiredSessions) * 100);
    const progressPercent = Math.round((daysProgress + sessionsProgress) / 2);

    const isEligible = daysActive >= req.requiredDays && attendedSessions >= req.requiredSessions;

    return {
        isEligible,
        nextRank: req.nextRank,
        progressPercent,
        daysActive,
        requiredDays: req.requiredDays,
        attendedSessions,
        requiredSessions: req.requiredSessions,
        isMaxRank: false,
    };
}
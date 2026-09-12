// lib/constants.ts
// Khai báo chung

// 1. Danh mục cấp đai chuẩn của võ đường
export const AIKIDO_RANKS = [
    "Đai trắng",
    "Đai xanh 1 vạch",
    "Đai xanh 2 vạch",
    "Đai xanh 3 vạch",
    "Đai nâu 1 vạch",
    "Đai nâu 2 vạch",
    "Đai nâu 3 vạch",
    "Đai đen (Shodan - 1 Đẳng)",
    "Đai đen (Nidan - 2 Đẳng)",
    "Đai đen (Sandan - 3 Đẳng)",
    "Đai đen (Yondan - 4 Đẳng)",
    "Đai đen (Godan - 5 Đẳng)",
    "Đai đen (Rokudan - 6 Đẳng)",
    "Đai đen (Nanadan - 7 Đẳng)",
    "Đai đen (Hachidan - 8 Đẳng)",
] as const;

// 2. Thông tin chi tiết các sân tập & học phí
export const DOJO_CONFIGS = {
    HAYATE: {
        key: "HAYATE",
        name: "Aikido Hayate",
        shortName: "Hayate",
        codePrefix: "HYT",
        feeAmount: 300000,
        feeCycle: "Tháng",
        mapUrl: "https://maps.app.goo.gl/ee12w88ToMxg8mYC7",
        address: "An Giang",
    },
    TACHI: {
        key: "TACHI",
        name: "Aikido Tachi",
        shortName: "Tachi",
        codePrefix: "TC",
        feeAmount: 600000,
        feeCycle: "Quý (3 tháng)",
        mapUrl: "https://maps.app.goo.gl/7R1g5EPAysy4KhQm8",
        address: "An Giang",
    },
} as const;

// 3. Lịch tập luyện định kỳ chung (Kèm link bản đồ của từng sân lấy từ DOJO_CONFIGS)
export const TRAINING_SCHEDULES = [
    {
        days: "Thứ 3, 5, 7",
        title: DOJO_CONFIGS.HAYATE.name,
        shortName: DOJO_CONFIGS.HAYATE.shortName,
        sessions: [
            "19:30 - 20:30"
        ],
        mapUrl: DOJO_CONFIGS.HAYATE.mapUrl,
        address: DOJO_CONFIGS.HAYATE.address,
    },
    {
        days: "Thứ 2, 4, 6",
        title: DOJO_CONFIGS.TACHI.name,
        shortName: DOJO_CONFIGS.TACHI.shortName,
        sessions: [
            "Ca 1: 17:30 - 19:00",
            "Ca 2: 19:10 - 20:30"
        ],
        mapUrl: DOJO_CONFIGS.TACHI.mapUrl,
        address: DOJO_CONFIGS.TACHI.address,
    },
];
// 4. Các chức vụ võ đường (Chuẩn hóa nhãn hiển thị trực quan, phân định rõ Môn sinh và HLV)
export const STUDENT_TITLES = {
    MEMBER: "Môn sinh",
    FUKU_SHIDOSHA: "Lớp phó",
    SHIDOSHA: "Lớp trưởng",
    SHIDOIN: "Huấn luyện viên",
} as const;

// Hằng số ánh xạ phụ trợ cho việc bóc tách chức vụ an toàn (Không dùng any)
export const TITLE_MAPPING: Record<string, string> = {
    MEMBER: "Môn sinh",
    STUDENT: "Môn sinh",
    FUKU_SHIDOSHA: "Lớp phó",
    SHIDOSHA: "Lớp trưởng",
    SHIDOIN: "Huấn luyện viên",
    COACH: "Huấn luyện viên",
    HLV: "Huấn luyện viên",
    SUPER_ADMIN: "HLV Trưởng",
} as const;

export function getTitleLabel(title?: string | null): string {
    if (!title) return STUDENT_TITLES.MEMBER;
    const cleanTitle = title.trim().toUpperCase();
    return TITLE_MAPPING[cleanTitle] || STUDENT_TITLES.MEMBER;
}

// 5. Thông tin liên hệ & HLV Trưởng (Dùng cho trang chủ)
export const DOJO_CONTACT_INFO = {
    headCoach: "Thầy Nguyễn Trần Anh Vũ",
    coachRank: "Đai Đen 4 Đẳng",
    phone: "058.312.4569",
    location: "An Giang, Việt Nam",
    email: "Amenguyen180593@gmail.com",
} as const;
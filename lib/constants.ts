// lib/constants.ts

//Khai báo chung

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
        name: "Sân Tachi",
        shortName: "Tachi",
        codePrefix: "TC",
        feeAmount: 600000,
        feeCycle: "Quý (3 tháng)",
        mapUrl: "https://maps.app.goo.gl/7R1g5EPAysy4KhQm8",
        address: "An Giang",
    },
} as const;

// 3. Lịch tập luyện định kỳ chung (Dùng mảng chứa các dòng ca tập để hiển thị xuống dòng linh hoạt)
export const TRAINING_SCHEDULES = [
    {
        days: "Thứ 3, 5, 7",
        title: "Sân Hayate",
        sessions: [
            "19:30 - 20:30"
        ],
    },
    {
        days: "Thứ 2, 4, 6",
        title: "Sân Tachi",
        sessions: [
            "Ca 1: 17:30 - 19:00",
            "Ca 2: 19:10 - 20:30"
        ],
    },
];

// 4. Các chức vụ võ đường
export const STUDENT_TITLES = {
    MEMBER: "Môn sinh (MEMBER)",
    FUKU_SHIDOSHA: "Lớp phó (FUKU_SHIDOSHA)",
    SHIDOSHA: "Lớp trưởng (SHIDOSHA)",
    SHIDOIN: "Huấn luyện viên (SHIDOIN)",
} as const;

// 5. Thông tin liên hệ & HLV Trưởng (Dùng cho trang chủ)
export const DOJO_CONTACT_INFO = {
    headCoach: "Nguyễn Trần Anh Vũ",
    coachRank: "Đai Đen 4 Đẳng",
    phone: "058.312.4569",
    location: "An Giang, Việt Nam",
    email: "aikidoangiang@dojo.com",
} as const;
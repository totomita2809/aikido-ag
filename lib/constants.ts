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
};

export function getTitleLabel(title?: string | null): string {
    if (!title) return STUDENT_TITLES.MEMBER;
    const cleanTitle = title.trim().toUpperCase();
    return TITLE_MAPPING[cleanTitle] || STUDENT_TITLES.MEMBER;
}

// 5. Thông tin liên hệ & HLV Trưởng (Dùng cho trang chủ)
export const DOJO_CONTACT_INFO = {
    headCoach: "Thầy Nguyễn Trần Anh Vũ",
    coachRank: "Đai Đen 4 Đẳng",
    phone: "058.312.4569",
    location: "An Giang, Việt Nam",
    email: "Amenguyen180593@gmail.com",
    // Thêm các trường phục vụ fallback đồng bộ:
    dojoName: "AIKIDO AN GIANG",
    headCoachRole: "HLV Trưởng",
    headCoachExperience: "",
    headCoachUnit: "aikido-an-giang",
    headCoachCode: "1",
} as const;

// 6. Thông tin Đội ngũ giảng dạy (Phục vụ hiển thị 2 nhóm thẻ)
export interface Instructor {
    name: string;
    role: string;
    rank: string;
    experience: string;
    dojo: string;
    unit: string;         // Tên thư mục đơn vị (vd: "aikido-an-giang", "don-vi-khac")
    code: number | string; // Mã ảnh tương ứng với tên file (vd: 1, 2)
}

// Hàm sinh đường dẫn ảnh tự động dựa theo thư mục và mã định danh
export function getInstructorImagePath(unit: string, code: number | string): string {
    return `/assets/images/trainers/${unit}/${code}.jpg`;
}

export const INSTRUCTOR_GROUPS: Record<string, { title: string; subtitle: string; instructors: Instructor[] }> = {
    anGiang: {
        title: "Đội ngũ Aikido An Giang",
        subtitle: "Những người dẫn dắt và phát triển phong trào võ đạo tại tỉnh nhà.",
        instructors: [
            {
                name: "Nguyễn Trần Anh Vũ",
                role: "HLV Trưởng",
                rank: "Đai đen - 4 Đẳng",
                experience: "9 Năm Giảng dạy",
                dojo: "Aikido An Giang",
                unit: "aikido-an-giang",
                code: 1,
            },
        ],
    },
    partners: {
        title: "Đội ngũ Đơn vị khác",
        subtitle: "Các huấn luyện viên đồng hành và liên kết hợp tác chuyên môn.",
        instructors: [
            {
                name: "Đang cập nhật",
                role: "HLV Liên Kết",
                rank: "Đai đen",
                experience: "Đang cập nhật",
                dojo: "Đơn vị liên kết",
                unit: "don-vi-khac",
                code: 1,
            },
        ],
    },
};


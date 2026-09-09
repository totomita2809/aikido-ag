export function getTitleLabel(title: string): string {
    switch (title) {
        case "SHIHAN":
        case "CHIEF_INSTRUCTOR":
            return "Huấn Luyện Viên Trưởng";
        case "SHIDOIN":
            return "Huấn Luyện Viên";
        case "SHIDOSHA":
            return "Lớp trưởng";
        case "FUKU_SHIDOSHA":
            return "Lớp phó";
        default:
            return "Môn sinh";
    }
}
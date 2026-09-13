import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DOJO_CONTACT_INFO, getInstructorImagePath } from '@/lib/constants';
import type { User, Student } from '@prisma/client';

type SafeStudent = Student & {
    avatar?: string | null;
    photo?: string | null;
    imageUrl?: string | null;
    picture?: string | null;
    image?: string | null;
};

type UserWithStudent = User & {
    student: SafeStudent | null;
};

interface InstructorItem {
    dojo: string;
    name: string;
    role: string;
    rank: string;
    experience: string;
    unit: string;
    code: string;
    avatar: string;
}

function sanitizeVietnamese(str: string | null | undefined): string {
    if (!str) return "";
    return str.normalize("NFC");
}

function mapTitle(rawTitle: string | null | undefined): string {
    const clean = sanitizeVietnamese(rawTitle);
    switch (clean.toUpperCase()) {
        case "SHIDOIN": return "Huấn luyện viên (Shidoin)";
        case "SHIDOSHA": return "Lớp trưởng";
        case "FUKU_SHIDOSHA": return "Lớp phó";
        case "MEMBER": return "Môn sinh";
        default: return clean || "HLV Giảng dạy";
    }
}

function formatDojoName(dojoVal: string | null | undefined): string {
    if (!dojoVal) return DOJO_CONTACT_INFO.dojoName;
    const upper = dojoVal.toUpperCase();
    if (upper === "BOTH" || upper.includes("AN GIANG") || upper.includes("GIANG")) return DOJO_CONTACT_INFO.dojoName;
    if (upper === "HAYATE") return "HAYATE DOJO";
    if (upper === "TACHI") return "TACHI DOJO";
    return sanitizeVietnamese(upper);
}

const HEAD_COACH_DEFAULT: InstructorItem = {
    dojo: DOJO_CONTACT_INFO.dojoName,
    name: DOJO_CONTACT_INFO.headCoach,
    role: DOJO_CONTACT_INFO.headCoachRole,
    rank: DOJO_CONTACT_INFO.coachRank,
    experience: DOJO_CONTACT_INFO.headCoachExperience,
    unit: DOJO_CONTACT_INFO.headCoachUnit,
    code: DOJO_CONTACT_INFO.headCoachCode,
    avatar: getInstructorImagePath(DOJO_CONTACT_INFO.headCoachUnit, DOJO_CONTACT_INFO.headCoachCode),
};

export async function GET() {
    try {
        const users: UserWithStudent[] = await prisma.user.findMany({
            include: {
                student: true
            }
        });

        const headCoachNameLower = DOJO_CONTACT_INFO.headCoach.toLowerCase();

        // Lọc chặt: chỉ lấy môn sinh có title SHIDOIN hoặc role HLV giảng dạy, loại bỏ admin/coach thuần không chuyên môn
        const filteredInstructors = users.filter((u) => {
            const s = u.student;
            const rawName = sanitizeVietnamese(s?.fullName ?? u.name ?? "").toLowerCase();
            const isHeadCoachName = rawName.includes(headCoachNameLower) || rawName.includes("anh vũ");

            const isDirectCoachRole = ['INSTRUCTOR', 'HLV', 'hlv', 'HLV_TRUONG'].includes(u.role);
            const isCoachTitle = s?.title === 'SHIDOIN';

            // Loại bỏ admin/coach tổng không gắn với SHIDOIN hoặc HLV chuyên môn
            const isAdminOrGenericCoach = ['ADMIN', 'SUPER_ADMIN', 'COACH'].includes(u.role) && !isCoachTitle && !isDirectCoachRole;
            if (isAdminOrGenericCoach) return false;

            return isDirectCoachRole || isCoachTitle || isHeadCoachName;
        });

        const dbMapped: InstructorItem[] = filteredInstructors.map((u, idx) => {
            const s = u.student;
            const rawName = s?.fullName ?? u.name ?? "Huấn luyện viên";
            const rawRank = s?.currentRank ?? "Đại đen";
            const rawUnit = s?.dojo ?? DOJO_CONTACT_INFO.headCoachUnit;
            const unit = String(rawUnit).toLowerCase();
            const code = s?.studentCode ?? u.id ?? String(idx + 1);

            const dbAvatarField: string = s?.avatar ?? s?.photo ?? s?.imageUrl ?? s?.picture ?? s?.image ?? u.image ?? "";

            const cleanName = sanitizeVietnamese(rawName);
            const isHeadCoach = cleanName.toLowerCase().includes(headCoachNameLower) || cleanName.toLowerCase().includes("anh vũ");

            const resolvedAvatar = dbAvatarField.trim().length > 0
                ? dbAvatarField.trim()
                : getInstructorImagePath(unit, code);

            return {
                dojo: formatDojoName(unit),
                name: isHeadCoach ? DOJO_CONTACT_INFO.headCoach : cleanName,
                role: isHeadCoach ? DOJO_CONTACT_INFO.headCoachRole : mapTitle(s?.title ?? u.role),
                rank: isHeadCoach ? DOJO_CONTACT_INFO.coachRank : sanitizeVietnamese(rawRank),
                experience: isHeadCoach ? DOJO_CONTACT_INFO.headCoachExperience : "",
                unit,
                code: String(code),
                avatar: isHeadCoach
                    ? getInstructorImagePath(DOJO_CONTACT_INFO.headCoachUnit, DOJO_CONTACT_INFO.headCoachCode)
                    : resolvedAvatar,
            };
        });

        const hasHeadCoach = dbMapped.some(item =>
            item.name.toLowerCase().includes(headCoachNameLower) ||
            item.role.toLowerCase().includes("hlv trưởng")
        );

        const finalInstructors: InstructorItem[] = hasHeadCoach
            ? dbMapped
            : [HEAD_COACH_DEFAULT, ...dbMapped];

        return NextResponse.json({
            title: "Đội ngũ Huấn luyện viên Aikido An Giang",
            subtitle: "Những huấn luyện viên đóng góp cho phong trào võ đạo tại tỉnh nhà.",
            instructors: finalInstructors.length > 0 ? finalInstructors : [HEAD_COACH_DEFAULT]
        });
    } catch (error) {
        console.error("Lỗi query HLV từ Prisma:", error);
        return NextResponse.json({
            title: "Đội ngũ Huấn luyện viên Aikido An Giang",
            subtitle: "Những huấn luyện viên đóng góp cho phong trào võ đạo tại tỉnh nhà.",
            instructors: [HEAD_COACH_DEFAULT]
        }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AIKIDO_RANKS } from "@/lib/constants";

// 1. Hàm chuẩn hóa cấp đai cũ về chuẩn chung
function normalizeBeltRank(oldRank: string | null): string {
    if (!oldRank) return AIKIDO_RANKS[0];
    const clean = oldRank.trim();
    if ((AIKIDO_RANKS as readonly string[]).includes(clean)) {
        return clean;
    }

    const lower = clean.toLowerCase();
    if (lower.includes("shodan") || lower.includes("1 đẳng") || lower === "đai đen 1" || lower === "đai đen (1 đẳng)" || lower === "đai đen" || lower === "đen") {
        return "Đai đen (Shodan - 1 Đẳng)";
    }
    if (lower.includes("nidan") || lower.includes("2 đẳng") || lower === "đai đen 2" || lower === "đai đen (2 đẳng)") {
        return "Đai đen (Nidan - 2 Đẳng)";
    }
    if (lower.includes("sandan") || lower.includes("3 đẳng")) {
        return "Đai đen (Sandan - 3 Đẳng)";
    }
    if (lower.includes("yondan") || lower.includes("4 đẳng")) {
        return "Đai đen (Yondan - 4 Đẳng)";
    }
    if (lower.includes("godan") || lower.includes("5 đẳng")) {
        return "Đai đen (Godan - 5 Đẳng)";
    }
    if (lower.includes("nâu 3") || lower.includes("dự bị shodan") || lower.includes("chuẩn đen")) {
        return "Đai nâu 3 vạch";
    }
    if (lower.includes("nâu 2")) {
        return "Đai nâu 2 vạch";
    }
    if (lower.includes("nâu 1") || lower.includes("nâu một")) {
        return "Đai nâu 1 vạch";
    }
    if (lower.includes("xanh 3")) {
        return "Đai xanh 3 vạch";
    }
    if (lower.includes("xanh 2")) {
        return "Đai xanh 2 vạch";
    }
    if (lower.includes("xanh 1") || lower.includes("xanh")) {
        return "Đai xanh 1 vạch";
    }
    if (lower.includes("trắng")) {
        return "Đai trắng";
    }

    return AIKIDO_RANKS[0];
}

// 2. Hàm tạo username và password đúng đặc tả: (họ + tên + số đuôi mã), pass = năm sinh
function generateStudentAccountInfo(fullName: string, studentCode: string, dateOfBirth: Date | null) {
    const normalizedName = fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const nameParts = normalizedName.split(/\s+/).filter(Boolean);

    let usernamePrefix = "";
    if (nameParts.length >= 2) {
        const lastName = nameParts[0];
        const firstName = nameParts[nameParts.length - 1];
        usernamePrefix = `${lastName}${firstName}`;
    } else if (nameParts.length === 1) {
        usernamePrefix = nameParts[0];
    } else {
        usernamePrefix = "user";
    }

    const matchCodeNum = studentCode.match(/\d+$/);
    const codeSuffix = matchCodeNum ? matchCodeNum[0] : "001";
    const username = `${usernamePrefix}${codeSuffix}`;

    let password = "123456";
    if (dateOfBirth) {
        password = dateOfBirth.getUTCFullYear().toString();
    }

    return { username, password };
}

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized - Chỉ HLV Trưởng mới có quyền đồng bộ dữ liệu" }, { status: 403 });
    }

    try {
        const students = await prisma.student.findMany({
            include: {
                user: true,
                rankHistories: true,
            },
        });

        let countStudentsUpdated = 0;
        let countUsersCreated = 0;
        let countUsersLinked = 0;
        let countRankHistoriesUpdated = 0;

        for (const student of students) {
            let needsStudentUpdate = false;
            const updatePayload: Record<string, unknown> = {};

            // Chuẩn hóa cấp đai
            const normalizedCurrentRank = normalizeBeltRank(student.currentRank);
            if (student.currentRank !== normalizedCurrentRank) {
                updatePayload.currentRank = normalizedCurrentRank;
                needsStudentUpdate = true;
            }

            if (needsStudentUpdate) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: updatePayload,
                });
                countStudentsUpdated++;
            }

            // Chuẩn hóa lịch sử đai
            for (const rh of student.rankHistories) {
                const normalizedHistoryRank = normalizeBeltRank(rh.rank);
                if (rh.rank !== normalizedHistoryRank) {
                    await prisma.rankHistory.update({
                        where: { id: rh.id },
                        data: { rank: normalizedHistoryRank },
                    });
                    countRankHistoriesUpdated++;
                }
            }

            // Tạo/Đồng bộ tài khoản User theo đúng đặc tả họ tên và năm sinh
            const { username, password } = generateStudentAccountInfo(student.fullName, student.studentCode, student.dateOfBirth);
            const userEmail = student.email || `${username}@aikidoangiang.local`;

            if (!student.user) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: userEmail },
                });

                if (existingUser) {
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: { studentId: student.id },
                    });
                    countUsersLinked++;
                } else {
                    const passwordHash = await bcrypt.hash(password, 10);
                    await prisma.user.create({
                        data: {
                            email: userEmail,
                            name: student.fullName,
                            passwordHash,
                            role: student.title === "SHIDOIN" ? "COACH" : "STUDENT",
                            studentId: student.id,
                        },
                    });
                    countUsersCreated++;
                }
            } else if (!student.user.studentId) {
                await prisma.user.update({
                    where: { id: student.user.id },
                    data: { studentId: student.id },
                });
                countUsersLinked++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Đồng bộ thành công! Cập nhật đai ${countStudentsUpdated} môn sinh, ${countRankHistoriesUpdated} lịch sử đai, tạo mới ${countUsersCreated} tài khoản User, liên kết bổ sung ${countUsersLinked} tài khoản.`,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Lỗi không xác định";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
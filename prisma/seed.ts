import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const adminPass = await bcrypt.hash("admin123456", 10);
    const coachPass = await bcrypt.hash("coach123456", 10);

    // 1. Tạo/Cập nhật hồ sơ Student cho HLV Trưởng Thầy Nguyễn Trần Anh Vũ
    const headCoachStudent = await prisma.student.upsert({
        where: { studentCode: "HLV-VU" },
        update: {
            fullName: "Nguyễn Trần Anh Vũ",
            currentRank: "Đai đen 4 Đẳng (Yondan)",
            title: "SHIDOIN",
            status: "ACTIVE",
            dojo: "HAYATE",
        },
        create: {
            studentCode: "HLV-VU",
            fullName: "Nguyễn Trần Anh Vũ",
            currentRank: "Đai đen 4 Đẳng (Yondan)",
            title: "SHIDOIN",
            status: "ACTIVE",
            dojo: "HAYATE",
        },
    });

    // 2. Tạo/Cập nhật tài khoản User Super Admin cho Thầy Nguyễn Trần Anh Vũ
    await prisma.user.upsert({
        where: { username: "admin" },
        update: {
            name: "Nguyễn Trần Anh Vũ",
            passwordHash: adminPass,
            role: "SUPER_ADMIN",
            isApproved: true,
            studentId: headCoachStudent.id,
        },
        create: {
            username: "admin",
            name: "Nguyễn Trần Anh Vũ",
            passwordHash: adminPass,
            role: "SUPER_ADMIN",
            isApproved: true,
            studentId: headCoachStudent.id,
        },
    });

    // 3. Tạo/Cập nhật tài khoản User HLV thường
    await prisma.user.upsert({
        where: { username: "coach" },
        update: {
            passwordHash: coachPass,
            role: "COACH",
            isApproved: true,
        },
        create: {
            username: "coach",
            name: "Huấn Luyện Viên",
            passwordHash: coachPass,
            role: "COACH",
            isApproved: true,
        },
    });

    // 4. Chuẩn hóa dữ liệu: Xóa sạch chữ "trơn" trong toàn bộ Database
    const updateStudents = await prisma.student.updateMany({
        where: { currentRank: "Đai trắng trơn" },
        data: { currentRank: "Đai trắng" },
    });

    const updateRankHistories = await prisma.rankHistory.updateMany({
        where: { rank: "Đai trắng trơn" },
        data: { rank: "Đai trắng" },
    });

    const updateCandidates = await prisma.examCandidate.updateMany({
        where: { targetRank: "Đai trắng trơn" },
        data: { targetRank: "Đai trắng" },
    });

    console.log("-----------------------------------------");
    console.log("Khởi tạo tài khoản thành công:");
    console.log("1. HLV Trưởng  -> user: admin | pass: admin123456 (Nguyễn Trần Anh Vũ - Đai đen 4 Đẳng)");
    console.log("2. HLV Thường  -> user: coach | pass: coach123456");
    console.log(`3. Chuẩn hóa tên đai: Đã đổi ${updateStudents.count} môn sinh, ${updateRankHistories.count} lịch sử đai, ${updateCandidates.count} ứng viên thi từ 'Đai trắng trơn' sang 'Đai trắng'.`);
    console.log("-----------------------------------------");
}

main()
    .catch((e: unknown) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
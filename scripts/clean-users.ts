import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Xóa tất cả user có vai trò không phải SUPER_ADMIN và COACH
    const result = await prisma.user.deleteMany({
        where: {
            role: {
                notIn: ["SUPER_ADMIN", "COACH"],
            },
        },
    });

    console.log(`Đã dọn dẹp thành công: Xóa ${result.count} tài khoản môn sinh (giữ nguyên SUPER_ADMIN và COACH).`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
    const session = await getSession();
    let pendingCount = 0;

    if (session?.role === "SUPER_ADMIN") {
        const [pendingAvatars, pendingNew, pendingEdits] = await Promise.all([
            prisma.student.count({ where: { avatarStatus: "PENDING" } }),
            prisma.student.count({ where: { approvalStatus: "PENDING_CREATION" } }),
            prisma.pendingStudentChange.count({ where: { status: "PENDING" } }),
        ]);
        pendingCount = pendingAvatars + pendingNew + pendingEdits;
    }

    return <NavbarClient session={session} pendingCount={pendingCount} />;
}
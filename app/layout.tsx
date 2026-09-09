import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata: Metadata = {
    title: "Aikido An Giang - Quản lý môn sinh",
    description: "Hệ thống quản lý môn sinh Aikido An Giang",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    const headersList = await headers();

    // Lấy đường dẫn hiện tại từ header của Next.js
    const pathname = headersList.get("x-invoke-path") || headersList.get("x-url") || "";

    // Nếu tài khoản bắt buộc đổi mật khẩu và chưa ở trang change-password hay login -> ép chuyển hướng
    if (
        session?.mustChangePassword &&
        !pathname.includes("/change-password") &&
        !pathname.includes("/login")
    ) {
        redirect("/change-password");
    }

    return (
        <html lang="vi">
            <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased">
                {/* Chỉ hiển thị Navbar khi không ở trạng thái bắt buộc đổi mật khẩu */}
                {!session?.mustChangePassword && <Navbar />}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </body>
        </html>
    );
}
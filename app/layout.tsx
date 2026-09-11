import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";

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
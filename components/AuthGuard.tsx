import Link from "next/link";
import { Lock, LogIn } from "lucide-react";
import { getSession } from "@/lib/auth";

export default async function AuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-5 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-3xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-lg border border-red-200 dark:border-red-900/60">
                    <Lock className="w-10 h-10" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Vui lòng đăng nhập để xem thông tin
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Hệ thống quản lý võ đường Aikido An Giang yêu cầu tài khoản được cấp quyền để truy cập dữ liệu.
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập ngay</span>
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
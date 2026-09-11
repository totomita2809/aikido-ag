"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { SessionPayload } from "@/lib/auth";
import NavbarAuth from "@/components/NavbarAuth";
import { getPendingApprovalTasks } from "@/app/actions/approval";
import SplashScreen from "@/components/SplashScreen";

interface NavbarClientProps {
    session: SessionPayload | null;
    pendingCount: number;
}

export default function NavbarClient({ session, pendingCount }: NavbarClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [showSplash, setShowSplash] = useState(false);

    // Đồng bộ state khi prop pendingCount từ Server Component thay đổi mà không dùng useEffect
    const [prevPendingCount, setPrevPendingCount] = useState(pendingCount);
    const [displayCount, setDisplayCount] = useState(pendingCount);

    if (pendingCount !== prevPendingCount) {
        setPrevPendingCount(pendingCount);
        setDisplayCount(pendingCount);
    }

    const isSuperAdmin = session?.role === "SUPER_ADMIN";
    const isStudent = session?.role === "STUDENT";
    const prevCountRef = useRef(pendingCount);

    // Polling tự động kiểm tra số lượng tác vụ chờ duyệt mỗi 5 giây cho Super Admin
    useEffect(() => {
        if (!isSuperAdmin) return;

        const syncPendingTasks = async () => {
            try {
                const tasks = await getPendingApprovalTasks();
                const newCount = tasks.length;

                setDisplayCount(newCount);

                // Nếu phát hiện có task mới hoặc số lượng thay đổi so với lần trước
                if (newCount !== prevCountRef.current) {
                    prevCountRef.current = newCount;
                    router.refresh(); // Tự động làm tươi dữ liệu
                }
            } catch (err: unknown) {
                console.error("Lỗi đồng bộ số tác vụ chờ duyệt:", err);
            }
        };

        const interval = setInterval(syncPendingTasks, 5000);
        return () => clearInterval(interval);
    }, [isSuperAdmin, router]);

    // Chỉ kích hoạt hiệu ứng Splash Screen khi bấm vào Logo hoặc link Trang chủ
    const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setIsOpen(false);

        if (pathname === "/") return;

        setShowSplash(true);
        setTimeout(() => {
            router.push("/");
            setShowSplash(false);
        }, 1200);
    };

    return (
        <>
            {showSplash && <SplashScreen />}

            <nav className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 sticky top-0 z-50 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo: Bấm vào chạy hiệu ứng splash (Bo tròn tuyệt đối, cắt sạch viền trắng) */}
                        <Link href="/" onClick={handleHomeClick} className="flex items-center space-x-3 group">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xs shrink-0">
                                <Image
                                    src="/logo/logo_aikido-ag.png"
                                    alt="Aikido An Giang Logo"
                                    fill
                                    sizes="40px"
                                    className="object-cover group-hover:scale-105 transition-transform"
                                    priority
                                />
                            </div>
                            <span className="font-extrabold text-lg md:text-xl tracking-wide text-slate-900 dark:text-white">
                                AIKIDO <span className="text-red-600">AN GIANG</span>
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-6">
                            {/* Trang chủ: Bấm vào chạy hiệu ứng splash */}
                            <Link
                                href="/"
                                onClick={handleHomeClick}
                                className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                            >
                                Trang chủ
                            </Link>

                            {/* Chỉ hiển thị các chức năng khi đã đăng nhập */}
                            {session && (
                                <>
                                    <Link
                                        href="/students"
                                        className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                                    >
                                        Danh sách môn sinh
                                    </Link>

                                    {/* Điểm danh và Học phí chỉ hiển thị cho HLV/Admin */}
                                    {!isStudent && (
                                        <>
                                            <Link
                                                href="/attendance"
                                                className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                                            >
                                                Điểm danh
                                            </Link>
                                            <Link
                                                href="/fees"
                                                className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                                            >
                                                Học phí
                                            </Link>
                                        </>
                                    )}

                                    <Link
                                        href="/promotions"
                                        className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                                    >
                                        Thăng đai
                                    </Link>

                                    {isStudent && (
                                        <Link
                                            href="/students/me"
                                            className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                                        >
                                            Hồ sơ của tôi
                                        </Link>
                                    )}

                                    {isSuperAdmin && (
                                        <Link
                                            href="/admin/approvals"
                                            className="relative inline-flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                                        >
                                            <span>Duyệt tác vụ</span>
                                            {displayCount > 0 && (
                                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-black leading-none text-white bg-red-600 rounded-full animate-pulse">
                                                    {displayCount}
                                                </span>
                                            )}
                                        </Link>
                                    )}
                                </>
                            )}

                            <NavbarAuth session={session} />
                        </div>

                        {/* Mobile Hamburger Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative cursor-pointer"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                {displayCount > 0 && !isOpen && isSuperAdmin && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isOpen && (
                    <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-2 relative z-50 pointer-events-auto">
                        {/* Mobile Trang chủ: Bấm vào chạy hiệu ứng splash */}
                        <Link
                            href="/"
                            onClick={handleHomeClick}
                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600"
                        >
                            Trang chủ
                        </Link>

                        {/* Chỉ hiển thị các chức năng khi đã đăng nhập */}
                        {session && (
                            <>
                                <Link
                                    href="/students"
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600"
                                >
                                    Danh sách môn sinh
                                </Link>

                                {!isStudent && (
                                    <>
                                        <Link
                                            href="/attendance"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600"
                                        >
                                            Điểm danh
                                        </Link>
                                        <Link
                                            href="/fees"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600"
                                        >
                                            Học phí
                                        </Link>
                                    </>
                                )}

                                <Link
                                    href="/promotions"
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600"
                                >
                                    Thăng đai
                                </Link>

                                {isStudent && (
                                    <Link
                                        href="/students/me"
                                        onClick={() => setIsOpen(false)}
                                        className="block px-3.5 py-2.5 rounded-lg text-base font-bold text-red-600 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 transition-colors"
                                    >
                                        Hồ sơ của tôi
                                    </Link>
                                )}

                                {isSuperAdmin && (
                                    <Link
                                        href="/admin/approvals"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600"
                                    >
                                        <span>Duyệt tác vụ</span>
                                        {displayCount > 0 && (
                                            <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                                                {displayCount}
                                            </span>
                                        )}
                                    </Link>
                                )}
                            </>
                        )}

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 relative z-50 pointer-events-auto">
                            <NavbarAuth
                                session={session}
                                isMobile={true}
                                onItemClick={() => {
                                    // Hoãn đóng menu để không làm gián đoạn tiến trình gọi logout trên mobile
                                    setTimeout(() => setIsOpen(false), 200);
                                }}
                            />
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
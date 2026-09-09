"use client";

import Link from "next/link";
import { User, LogOut, ShieldCheck } from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { SessionPayload } from "@/lib/auth";

interface NavbarAuthProps {
    session: SessionPayload | null;
    isMobile?: boolean;
    onItemClick?: () => void;
}

export default function NavbarAuth({ session, isMobile = false, onItemClick }: NavbarAuthProps) {
    if (!session) {
        if (isMobile) {
            return (
                <Link
                    href="/login"
                    onClick={onItemClick}
                    className="block w-full text-center bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-base font-medium mt-2"
                >
                    Đăng nhập
                </Link>
            );
        }

        return (
            <Link
                href="/login"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
            >
                <User className="h-4 w-4" />
                <span>Đăng nhập</span>
            </Link>
        );
    }

    if (isMobile) {
        return (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="px-3">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {session.name}
                    </p>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{session.role === "SUPER_ADMIN" ? "HLV Trưởng" : "HLV"}</span>
                    </span>
                </div>
                <form action={logout}>
                    <button
                        type="submit"
                        onClick={onItemClick}
                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-2"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right flex flex-col justify-center">
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {session.name}
                </span>
                <span className="inline-flex items-center justify-end space-x-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{session.role === "SUPER_ADMIN" ? "HLV Trưởng" : "HLV"}</span>
                </span>
            </div>
            <form action={logout}>
                <button
                    type="submit"
                    title="Đăng xuất"
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </form>
        </div>
    );
}
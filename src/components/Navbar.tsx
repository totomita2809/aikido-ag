"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Menu, X, User } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <Shield className="h-8 w-8 text-red-500" />
                        <Link href="/" className="font-bold text-lg md:text-xl tracking-wide">
                            AIKIDO AN GIANG
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/" className="hover:text-red-400 transition-colors">
                            Danh sách môn sinh
                        </Link>
                        <Link href="/students/new" className="hover:text-red-400 transition-colors">
                            Thêm môn sinh
                        </Link>
                        <Link
                            href="/login"
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors"
                        >
                            <User className="h-4 w-4" />
                            <span>Đăng nhập</span>
                        </Link>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-md hover:bg-slate-800 text-gray-300 hover:text-white"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 pt-2 pb-4 space-y-2">
                    <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-md text-base hover:bg-slate-700"
                    >
                        Danh sách môn sinh
                    </Link>
                    <Link
                        href="/students/new"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-md text-base hover:bg-slate-700"
                    >
                        Thêm môn sinh
                    </Link>
                    <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="block w-full text-center bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-lg text-base font-medium mt-2"
                    >
                        Đăng nhập
                    </Link>
                </div>
            )}
        </nav>
    );
}
"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { ShieldAlert, LogIn, Lock, User } from "lucide-react";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, undefined);

    return (
        <div className="min-h-[75vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                        <LogIn className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Aikido An Giang
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Hệ Thống Quản Lý Võ Đường
                    </p>
                </div>

                {state?.error && (
                    <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        <span>{state.error}</span>
                    </div>
                )}

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                            Tên đăng nhập
                        </label>
                        <div className="relative">
                            <User className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                name="username"
                                required
                                placeholder="admin hoặc coach"
                                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <Lock className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="password"
                                name="password"
                                required
                                placeholder="••••••••"
                                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full mt-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-md flex items-center justify-center space-x-2"
                    >
                        {isPending ? (
                            <span>Đang kiểm tra...</span>
                        ) : (
                            <>
                                <LogIn className="w-4 h-4" />
                                <span>Đăng nhập</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
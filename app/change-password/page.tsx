"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Eye, EyeOff, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { changeFirstTimePassword } from "@/app/actions/password";

export default function ChangePasswordPage() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setErrorMsg(null);

        if (newPassword !== confirmPassword) {
            setErrorMsg("Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);

        try {
            const res = await changeFirstTimePassword(newPassword);
            setSuccessMsg(res.message || "Thành công!");
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
            setErrorMsg(msg);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-lg">
                <div className="space-y-2 text-center">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Bắt buộc đổi mật khẩu
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Vì đây là lần đăng nhập đầu tiên, hệ thống yêu cầu bạn đổi mật khẩu mặc định sang mật khẩu cá nhân an toàn hơn.
                    </p>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs rounded-xl font-semibold">
                        {errorMsg}
                    </div>
                )}

                {successMsg ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{successMsg}</p>
                        <p className="text-[11px] text-slate-400">Đang chuyển hướng về trang đăng nhập...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="VD: Aikidoag2017@"
                                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Tối thiểu 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Xác nhận mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••"
                                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-[11px] text-red-500 mt-1">Mật khẩu xác nhận chưa khớp.</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || newPassword !== confirmPassword}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Đang cập nhật...</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    <span>Xác nhận đổi mật khẩu</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
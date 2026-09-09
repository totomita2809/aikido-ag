"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { requestStudentProfileUpdate } from "@/app/actions/student";

export default function StudentSelfEditPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [address, setAddress] = useState("");
    const [avatar, setAvatar] = useState("");

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const formData = new FormData();
        if (phone.trim()) formData.append("phone", phone.trim());
        if (parentPhone.trim()) formData.append("parentPhone", parentPhone.trim());
        if (address.trim()) formData.append("address", address.trim());
        if (avatar.trim()) formData.append("avatar", avatar.trim());

        try {
            await requestStudentProfileUpdate(formData);
            setShowSuccessModal(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi gửi yêu cầu.";
            setErrorMsg(msg);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    href="/students/me"
                    className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại hồ sơ cá nhân</span>
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Yêu cầu chỉnh sửa thông tin cá nhân
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Theo quy định của võ đường Aikido An Giang, mọi thay đổi thông tin liên lạc và hình ảnh cần được HLV Trưởng xét duyệt.
                    </p>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs rounded-xl font-semibold">
                        {errorMsg}
                    </div>
                )}

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start space-x-3 text-amber-800 dark:text-amber-300 text-xs">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                        <span className="font-bold">Lưu ý quy định:</span> Sau khi bấm lưu, thông tin của bạn sẽ được chuyển về bộ phận quản lý để kiểm tra và xử lý trong vòng 48 tiếng.
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Số điện thoại cá nhân mới
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="09xxxxxxxx"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Số điện thoại phụ huynh mới
                        </label>
                        <input
                            type="tel"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value)}
                            placeholder="09xxxxxxxx"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Địa chỉ thường trú mới
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Địa chỉ cư trú hiện tại"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Đường dẫn ảnh đại diện mới (URL Hình ảnh)
                        </label>
                        <input
                            type="url"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link
                            href="/students/me"
                            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Hủy bỏ
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Đang gửi yêu cầu...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Lưu thay đổi</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Popup Thông báo thành công & Chờ duyệt trong 48 tiếng */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Gửi yêu cầu thành công
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Yêu cầu thay đổi thông tin đã được ghi nhận. Vui lòng đợi duyệt trong 48 tiếng.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setShowSuccessModal(false);
                                router.push("/students/me");
                                router.refresh();
                            }}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                        >
                            Xác nhận & Về trang hồ sơ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
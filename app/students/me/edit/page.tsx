"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Loader2,
    CheckCircle2,
    ShieldAlert,
    Camera,
    Upload,
    X,
} from "lucide-react";
import { requestStudentProfileUpdate, getStudentSelfProfile } from "@/app/actions/student";

export default function StudentSelfEditPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [gender, setGender] = useState("Nam");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [healthNote, setHealthNote] = useState("");
    const [avatar, setAvatar] = useState("");
    const [currentRank, setCurrentRank] = useState("");
    const [joinDate, setJoinDate] = useState("");

    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Nạp dữ liệu hiện tại từ database lên form khi mở trang
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await getStudentSelfProfile();
                if (profile) {
                    if (profile.fullName) setFullName(profile.fullName);
                    if (profile.phone) setPhone(profile.phone);
                    if (profile.parentPhone) setParentPhone(profile.parentPhone);
                    if (profile.email) setEmail(profile.email);
                    if (profile.address) setAddress(profile.address);
                    if (profile.gender) setGender(profile.gender);
                    if (profile.healthNote) setHealthNote(profile.healthNote);
                    if (profile.avatar) setAvatar(profile.avatar);
                    if (profile.currentRank) setCurrentRank(profile.currentRank);
                    if (profile.dateOfBirth) {
                        const dobStr = new Date(profile.dateOfBirth).toISOString().split("T")[0];
                        setDateOfBirth(dobStr);
                    }
                    if (profile.joinDate) {
                        const dateStr = new Date(profile.joinDate).toISOString().split("T")[0];
                        setJoinDate(dateStr);
                    }
                }
            } catch (err: unknown) {
                console.error("Lỗi khi nạp dữ liệu môn sinh:", err);
            } finally {
                setInitialLoading(false);
            }
        };

        loadProfile();
    }, []);

    // Xử lý nạp ảnh thẻ và chuyển đổi sang Data URL (Base64)
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Dung lượng ảnh tối đa là 2MB. Vui lòng chọn ảnh nhẹ hơn!");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                setAvatar(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const formData = new FormData();
        if (fullName.trim()) formData.append("fullName", fullName.trim());
        if (phone.trim()) formData.append("phone", phone.trim());
        if (parentPhone.trim()) formData.append("parentPhone", parentPhone.trim());
        if (email.trim()) formData.append("email", email.trim());
        if (address.trim()) formData.append("address", address.trim());
        if (gender.trim()) formData.append("gender", gender.trim());
        if (dateOfBirth.trim()) formData.append("dateOfBirth", dateOfBirth.trim());
        if (healthNote.trim()) formData.append("healthNote", healthNote.trim());
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

    if (initialLoading) {
        return (
            <div className="max-w-2xl mx-auto min-h-[50vh] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-red-600" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Đang tải dữ liệu môn sinh...
                </span>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <Link
                    href="/students/me"
                    className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại hồ sơ</span>
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Yêu cầu chỉnh sửa thông tin cá nhân
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cập nhật thông tin cá nhân của bạn. Trừ Cấp đai và Ngày nhập môn, các thông tin khác sẽ được HLV Trưởng xét duyệt trước khi áp dụng.
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
                        <span className="font-bold">Lưu ý quy trình duyệt:</span> HLV Trưởng sẽ xác minh lại số điện thoại phụ huynh trước khi phê duyệt để phòng trường hợp cung cấp số ảo.
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Khối Ảnh thẻ môn sinh */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt="Ảnh thẻ" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
                                    <Camera className="w-8 h-8 stroke-[1.5]" />
                                    <span className="text-[10px] mt-1 font-medium">Ảnh thẻ</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5 text-center sm:text-left flex-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                Ảnh thẻ môn sinh (Chân dung / Võ phục)
                            </label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Hỗ trợ định dạng JPG, PNG hoặc WebP. Dung lượng khuyến nghị dưới 2MB.
                            </p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                                <label className="cursor-pointer px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-xs">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{avatar ? "Thay ảnh mới" : "Chọn ảnh"}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                                {avatar && (
                                    <button
                                        type="button"
                                        onClick={() => setAvatar("")}
                                        className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-medium transition-colors cursor-pointer inline-flex items-center space-x-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Xóa ảnh</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Họ và tên đầy đủ mới
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nhập họ và tên đầy đủ"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Ngày sinh
                            </label>
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Giới tính
                            </label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Email liên hệ mới
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@gmail.com"
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
                            Tình trạng sức khỏe & Lưu ý bệnh lý mới
                        </label>
                        <textarea
                            value={healthNote}
                            onChange={(e) => setHealthNote(e.target.value)}
                            rows={2}
                            placeholder="Tiền sử bệnh lý, dị ứng hoặc chấn thương cũ..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    {/* Các trường bị khóa (Không cho phép môn sinh tự sửa): Cấp đai và Ngày nhập môn */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                                Cấp đai hiện tại <span className="text-xs text-red-500">(Không thể tự đổi)</span>
                            </label>
                            <input
                                type="text"
                                value={currentRank}
                                disabled
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                                Ngày gia nhập võ đường <span className="text-xs text-red-500">(Không thể tự đổi)</span>
                            </label>
                            <input
                                type="date"
                                value={joinDate}
                                disabled
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                            />
                        </div>
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
                            Xác nhận & Về hồ sơ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Camera, AlertCircle, Clock, Check,  ShieldAlert } from "lucide-react";
import { requestAvatarUpdate } from "@/app/actions/avatar";

interface Props {
    studentId: string;
    currentAvatar: string | null;
    pendingAvatar: string | null;
    avatarStatus: string | null;
}

export default function StudentAvatarUploader({
    studentId,
    currentAvatar,
    pendingAvatar,
    avatarStatus,
}: Props) {
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Xử lý nén ảnh về JPEG chuẩn ảnh thẻ
    const processAndCompressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement("img");
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                // Chuẩn hóa kích thước tối đa cho ảnh chân dung (600x800px)
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                if (ctx) {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    // Nén và chuyển đổi sang JPEG chất lượng 0.82
                    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
                    resolve(compressedDataUrl);
                } else {
                    reject(new Error("Lỗi xử lý hình ảnh"));
                }
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
            alert("Hệ thống chỉ chấp nhận định dạng ảnh JPG, JPEG hoặc PNG.");
            return;
        }

        try {
            const compressed = await processAndCompressImage(file);
            setSelectedPreview(compressed);
            setShowRuleModal(true);
        } catch {
            alert("Không thể đọc định dạng ảnh này. Vui lòng thử lại ảnh khác.");
        }
    };

    const handleConfirmUpload = () => {
        if (!selectedPreview) return;

        startTransition(async () => {
            await requestAvatarUpdate(studentId, selectedPreview);
            setShowRuleModal(false);
            setIsSubmitted(true);
        });
    };

    const displayImage = selectedPreview || pendingAvatar || currentAvatar;

    return (
        <div className="flex flex-col items-center sm:items-start space-y-3">
            {/* Vùng hiển thị Avatar */}
            <div className="relative group">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-inner flex items-center justify-center">
                    {displayImage ? (
                        <Image src={displayImage} alt="Ảnh thẻ" fill className="object-cover" />
                    ) : (
                        <Camera className="w-10 h-10 text-slate-400" />
                    )}

                    {/* Nút bấm tải ảnh đè lên */}
                    <label
                        htmlFor={`avatar-upload-${studentId}`}
                        className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold"
                    >
                        <Camera className="w-6 h-6 mb-1" />
                        <span>Đổi ảnh thẻ</span>
                    </label>
                    <input
                        id={`avatar-upload-${studentId}`}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleFileChange}
                        className="sr-only"
                    />
                </div>

                {/* Nhãn trạng thái */}
                {(avatarStatus === "PENDING" || isSubmitted) && (
                    <span className="absolute -bottom-2 -right-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow">
                        <Clock className="w-3 h-3" />
                        <span>Chờ duyệt</span>
                    </span>
                )}
            </div>

            <p className="text-[11px] text-slate-400 text-center sm:text-left">
                Chấp nhận JPG, PNG. Tối đa 5MB (Tự động nén tối ưu).
            </p>

            {/* MODAL THÔNG BÁO QUY ĐỊNH ẢNH THẺ & DUYỆT 48H */}
            {showRuleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
                            <ShieldAlert className="w-7 h-7 shrink-0" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Quy Định Ảnh Thẻ Môn Sinh
                            </h3>
                        </div>

                        <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                            <p className="font-medium text-slate-900 dark:text-white">
                                Vui lòng đảm bảo ảnh tải lên đáp ứng các tiêu chuẩn sau:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                <li>Ảnh chụp chính diện, rõ mặt, phông nền sáng màu.</li>
                                <li>Trang phục nghiêm túc (khuyến khích mặc Võ phục Aikido - Dogi).</li>
                                <li>Không đeo kính râm, không đội mũ, không dùng hiệu ứng filter làm biến dạng khuôn mặt.</li>
                            </ul>

                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>
                                    Ảnh thẻ mới sẽ được <strong>Ban Quản Trị xét duyệt trong vòng 48 tiếng</strong> trước khi hiển thị chính thức trên hệ thống điểm danh.
                                </span>
                            </div>
                        </div>

                        {/* Xem trước ảnh đã qua nén */}
                        {selectedPreview && (
                            <div className="flex justify-center pt-2">
                                <div className="relative w-24 h-32 rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                                    <Image src={selectedPreview} alt="Xem trước ảnh thẻ" fill className="object-cover" />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRuleModal(false);
                                    setSelectedPreview(null);
                                }}
                                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleConfirmUpload}
                                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isPending ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span>{isPending ? "Đang gửi..." : "Tôi hiểu & Gửi duyệt"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
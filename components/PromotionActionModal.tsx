"use client";

import { useState, useTransition } from "react";
import { Award, Check, Sparkles, X, Loader2, AlertTriangle } from "lucide-react";
import { promoteStudent } from "@/app/actions/promotion";

const AVAILABLE_RANKS = [
    "Đai trắng",
    "Đai xanh 1 vạch",
    "Đai xanh 2 vạch",
    "Đai xanh 3 vạch",
    "Đai nâu 1 vạch",
    "Đai nâu 2 vạch",
    "Đai nâu 3 vạch",
    "Đai đen (Shodan)",
    "Đai đen (Nidan)",
    "Đai đen (Sandan)",
];

interface Props {
    studentId: string;
    studentName: string;
    currentRank: string;
    suggestedNextRank: string;
    isEligible: boolean;
    isSuperAdmin?: boolean; // Cờ kiểm tra quyền Super Admin
    attendanceCount?: number;   // Thêm thông tin số buổi tập
    totalActiveMonths?: number; // Thêm thông tin số tháng hoạt động
}

export default function PromotionActionModal({
    studentId,
    studentName,
    currentRank,
    suggestedNextRank,
    isEligible,
    isSuperAdmin = true, // Tạm thời để true cho môi trường thử nghiệm
    attendanceCount = 0,
    totalActiveMonths = 1,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [targetRank, setTargetRank] = useState(suggestedNextRank || "Đai xanh 1 vạch");
    const [isSpecialNomination, setIsSpecialNomination] = useState(!isEligible);
    const [notes, setNotes] = useState("");
    const [isPending, startTransition] = useTransition();

    if (!isSuperAdmin) {
        return null; // Không phải Super Admin thì không hiển thị nút
    }

    // Tính toán tần suất thực tế (Ngưỡng cảnh báo: trung bình dưới 4 buổi/tháng)
    const averageAttendance = totalActiveMonths > 0 ? attendanceCount / totalActiveMonths : 0;
    const isLowAttendance = averageAttendance < 4 && !isEligible;

    const handleConfirm = () => {
        if (isLowAttendance && !isSpecialNomination) {
            alert("Môn sinh này có tần suất tập luyện quá ít! Bạn bắt buộc phải chọn 'Đặc cách bởi Quyền Hạn Super Admin' để tiếp tục.");
            return;
        }

        startTransition(async () => {
            const res = await promoteStudent({
                studentId,
                targetRank,
                notes,
                isSpecialNomination,
                attendanceCount,
                totalActiveMonths,
            });

            if (res.success) {
                setIsOpen(false);
                window.location.reload();
            } else {
                alert(res.error || "Thao tác thất bại");
            }
        });
    };

    return (
        <>
            <button
                onClick={() => {
                    setTargetRank(suggestedNextRank || currentRank);
                    setIsSpecialNomination(!isEligible);
                    setIsOpen(true);
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isEligible
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-100 hover:bg-amber-100 text-slate-700 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-amber-950/60 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700"
                    }`}
            >
                {isEligible ? (
                    <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Thăng đai</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đặc cách thi</span>
                    </>
                )}
            </button>

            {/* POPUP XÁC NHẬN THĂNG ĐAI / ĐẶC CÁCH */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <Award className="w-5 h-5" />
                                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                    Quyết Định Thăng Cấp Đai
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="text-sm space-y-3">
                            <div>
                                <p className="text-xs text-slate-400">Môn sinh được duyệt:</p>
                                <p className="font-bold text-base text-slate-900 dark:text-white">
                                    {studentName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Cấp đai hiện tại: <strong className="text-slate-700 dark:text-slate-300">{currentRank}</strong>
                                </p>
                            </div>

                            {/* Cảnh báo chuyên cần thấp tự động */}
                            {isLowAttendance && (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Cảnh báo tần suất tập luyện thấp!</p>
                                        <p className="mt-0.5 opacity-90">
                                            Môn sinh tập trung bình dưới 4 buổi/tháng. Bắt buộc phải xác nhận đặc cách từ Super Admin.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Lựa chọn cấp đai chỉ định lên */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Cấp đai chỉ định cho thi/thăng cấp:
                                </label>
                                <select
                                    value={targetRank}
                                    onChange={(e) => setTargetRank(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    {AVAILABLE_RANKS.map((rank) => (
                                        <option key={rank} value={rank}>
                                            {rank}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ô tick cho phép đặc cách thi khi chưa đủ điều kiện */}
                            <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isSpecialNomination}
                                    onChange={(e) => setIsSpecialNomination(e.target.checked)}
                                    className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                                />
                                <div className="text-xs">
                                    <span className="font-bold text-amber-900 dark:text-amber-200 block">
                                        Đặc cách bởi Quyền Hạn Super Admin
                                    </span>
                                    <span className="text-amber-700 dark:text-amber-400">
                                        Môn sinh có năng khiếu, kỹ thuật vững, cho phép thi nâng cấp dù chưa đủ thời gian hoặc số buổi tối thiểu.
                                    </span>
                                </div>
                            </label>

                            {/* Ghi chú lý do đặc cách */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Ghi chú hồ sơ thi đai:
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="VD: Kỹ thuật tốt, phản xạ ukemi chuẩn..."
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleConfirm}
                                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                <span>{isPending ? "Đang xử lý..." : "Phê duyệt thăng đai"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
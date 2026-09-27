"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { Upload, Check, AlertCircle, Eye, X } from "lucide-react";
import { updateFeeDetails } from "@/app/actions/fee";
import { StudentRow } from "@/components/FeeTableRows";

interface FeeRowEditPanelProps {
    student: StudentRow;
    onClose: () => void;
}

export default function FeeRowEditPanel({ student, onClose }: FeeRowEditPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Khởi tạo ngày hiện tại dạng dd/MM/yyyy
    const getInitialDateStr = () => {
        if (student.paidAt) {
            const pd = new Date(student.paidAt);
            return `${String(pd.getDate()).padStart(2, "0")}/${String(pd.getMonth() + 1).padStart(2, "0")}/${pd.getFullYear()}`;
        }
        const d = new Date();
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const [isPaid, setIsPaid] = useState<boolean>(student.isPaid);
    const [paidDateStr, setPaidDateStr] = useState<string>(getInitialDateStr());
    const [amount, setAmount] = useState<number>(student.amount || student.feeConfig.amount);
    const [paymentMethod, setPaymentMethod] = useState<string>(student.paymentMethod || "Tiền mặt");
    const [receiptUrl, setReceiptUrl] = useState<string | null>(student.receiptUrl || null);

    // Tính toán các nấc tiền động theo mức cơ sở của từng sân
    const generateDynamicTiers = () => {
        const baseAmount = student.feeConfig.amount;
        if (student.dojo === "TACHI") {
            const oneMonth = Math.round(baseAmount / 3);
            return [
                { label: `${(oneMonth / 1000).toLocaleString("vi-VN")}k (1 tháng)`, value: oneMonth },
                { label: `${((oneMonth * 2) / 1000).toLocaleString("vi-VN")}k (2 tháng)`, value: oneMonth * 2 },
                { label: `${(baseAmount / 1000).toLocaleString("vi-VN")}k (Trọn quý 3 tháng)`, value: baseAmount },
                { label: `${((oneMonth * 4) / 1000).toLocaleString("vi-VN")}k (4 tháng)`, value: oneMonth * 4 },
                { label: `${((oneMonth * 5) / 1000).toLocaleString("vi-VN")}k (5 tháng)`, value: oneMonth * 5 },
            ];
        } else {
            return [
                { label: `${(baseAmount / 1000).toLocaleString("vi-VN")}k (1 tháng chuẩn)`, value: baseAmount },
                { label: `${((baseAmount * 2) / 1000).toLocaleString("vi-VN")}k (Đóng 2 tháng)`, value: baseAmount * 2 },
                { label: `${((baseAmount * 3) / 1000).toLocaleString("vi-VN")}k (Đóng 3 tháng)`, value: baseAmount * 3 },
                { label: `${((baseAmount * 4) / 1000).toLocaleString("vi-VN")}k (Đóng 4 tháng)`, value: baseAmount * 4 },
            ];
        }
    };

    const tiers = generateDynamicTiers();

    // Mask định dạng ngày dd/MM/yyyy: chỉ cho nhập số, tự động chèn dấu "/"
    const handleDateChange = (val: string) => {
        const cleaned = val.replace(/\D/g, "").slice(0, 8);
        let formatted = cleaned;
        if (cleaned.length >= 3 && cleaned.length <= 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        } else if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
        }
        setPaidDateStr(formatted);
    };

    // Xử lý upload ảnh chứng từ chuyển khoản / tin nhắn
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                let parsedDate: string | undefined = undefined;
                if (isPaid && paidDateStr.includes("/")) {
                    const [d, m, y] = paidDateStr.split("/");
                    if (d && m && y && y.length === 4) {
                        parsedDate = new Date(Number(y), Number(m) - 1, Number(d)).toISOString();
                    }
                }

                const formData = new FormData();
                formData.append("studentId", student.id);
                formData.append("month", String(student.month));
                formData.append("year", String(student.year));
                formData.append("amount", String(amount));
                formData.append("isPaid", String(isPaid));
                if (parsedDate) {
                    formData.append("paidAt", parsedDate);
                }
                formData.append("paymentMethod", paymentMethod);
                if (receiptUrl) {
                    formData.append("receiptUrl", receiptUrl);
                }

                await updateFeeDetails(formData);

                onClose();
            } catch (err: unknown) {
                alert(err instanceof Error ? err.message : "Lỗi lưu học phí");
            }
        });
    };

    return (
        <>
            <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                <td colSpan={5} className="p-4 sm:p-5">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>Thu Phí Môn Sinh:</span>
                                <span className="text-red-600">{student.fullName}</span>
                                <span className="font-mono text-xs font-normal text-slate-400">({student.studentCode})</span>
                            </h4>
                            <span className="text-xs text-slate-500">
                                Kỳ thu: Tháng {student.month}/{student.year}
                            </span>
                        </div>

                        {/* 1. Trạng thái thu phí */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                1. Trạng thái học phí:
                            </label>
                            <div className="flex items-center space-x-4 text-xs">
                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`status-${student.id}`}
                                        checked={!isPaid}
                                        onChange={() => setIsPaid(false)}
                                        className="text-red-600 focus:ring-red-500 cursor-pointer"
                                    />
                                    <span className="text-slate-600 dark:text-slate-300">Chưa đóng (Mặc định đầu tháng)</span>
                                </label>
                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`status-${student.id}`}
                                        checked={isPaid}
                                        onChange={() => setIsPaid(true)}
                                        className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className="text-emerald-600 font-bold">Đã nộp tiền</span>
                                </label>
                            </div>
                        </div>

                        {/* Các mục mở rộng khi chọn "Đã nộp tiền" */}
                        {isPaid && (
                            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 2. Ngày đóng tiền */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            2. Ngày đóng tiền (dd/MM/yyyy):
                                        </label>
                                        <input
                                            type="text"
                                            value={paidDateStr}
                                            onFocus={() => setPaidDateStr("")}
                                            onChange={(e) => handleDateChange(e.target.value)}
                                            placeholder="dd/MM/yyyy"
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
                                        />
                                        <span className="text-[10px] text-slate-400 block">
                                            * Chỉ nhập số, hệ thống tự chèn dấu gạch chéo
                                        </span>
                                    </div>

                                    {/* 3. Hình thức thanh toán */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            3. Hình thức thu:
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden cursor-pointer"
                                        >
                                            <option value="Tiền mặt">Tiền mặt</option>
                                            <option value="Chuyển khoản">Chuyển khoản qua ngân hàng</option>
                                        </select>
                                    </div>
                                </div>

                                {/* 4. Mức học phí nạp động theo quy định sân */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        4. Mức học phí thu thực tế ({student.feeConfig.dojoName}):
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {tiers.map((tier) => (
                                            <button
                                                key={tier.value}
                                                type="button"
                                                onClick={() => setAmount(tier.value)}
                                                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${amount === tier.value
                                                    ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 ring-2 ring-red-500/20"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                                                    }`}
                                            >
                                                {tier.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. Tải ảnh chụp biên lai / tin nhắn xác nhận */}
                                <div className="space-y-2 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/60">
                                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>Chứng từ biên lai / Tin nhắn phụ huynh:</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        HLV Trưởng hãy tải ảnh chụp bill chuyển khoản hoặc tin nhắn xác nhận đã đóng tiền để lưu làm bằng chứng đối soát, tránh bị quên.
                                    </p>

                                    <div className="flex items-center space-x-3 pt-1">
                                        <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs">
                                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Chọn ảnh chụp biên lai / Tin nhắn</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>

                                        {receiptUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewImage(receiptUrl)}
                                                className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Xem trước ảnh đã chọn</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Nút thao tác */}
                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleSave}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isPending ? "Đang lưu..." : "Xác nhận & Lưu học phí"}</span>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>

            {/* Modal phóng to ảnh xem chi tiết */}
            {previewImage && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Ảnh chứng từ / Biên lai</span>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative w-full h-80 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <Image
                                src={previewImage}
                                alt="Chứng từ học phí"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { X, Calendar, CreditCard, Banknote, Check, User } from "lucide-react";
import { updateFeeDetails } from "@/app/actions/fee";

interface StudentFeeInfo {
    studentId: string;
    studentCode: string;
    fullName: string;
    avatar?: string | null;
    month: number;
    year: number;
    amount: number;
    isPaid: boolean;
    paidAt?: Date | null;
    paymentMethod?: string | null;
}

interface Props {
    data: StudentFeeInfo;
    isOpen: boolean;
    onClose: () => void;
}

function toLocalDatetimeString(d?: Date | null) {
    const date = d ? new Date(d) : new Date();
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset);
    return local.toISOString().slice(0, 16);
}

export default function FeeEditModal({ data, isOpen, onClose }: Props) {
    const [isPending, startTransition] = useTransition();

    const [isPaid, setIsPaid] = useState(data.isPaid);
    const [paidAt, setPaidAt] = useState(toLocalDatetimeString(data.paidAt));
    const [paymentMethod, setPaymentMethod] = useState(data.paymentMethod || "Tiền mặt");

    if (!isOpen) return null;

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("studentId", data.studentId);
        formData.append("month", data.month.toString());
        formData.append("year", data.year.toString());
        formData.append("amount", data.amount.toString());
        formData.append("isPaid", isPaid ? "true" : "false");
        formData.append("paidAt", paidAt);
        formData.append("paymentMethod", paymentMethod);

        startTransition(async () => {
            await updateFeeDetails(formData);
            onClose();
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        Cập nhật thông tin học phí
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center space-x-3.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600">
                        {data.avatar ? (
                            <Image src={data.avatar} alt={data.fullName} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User className="w-6 h-6" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{data.fullName}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                            <span className="font-mono text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded">
                                {data.studentCode}
                            </span>
                            <span className="text-xs text-slate-500">
                                Tháng {data.month}/{data.year}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            Tình trạng thu:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPaid(true)}
                                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center space-x-1.5 transition-colors ${isPaid
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                    }`}
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã đóng</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPaid(false)}
                                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center space-x-1.5 transition-colors ${!isPaid
                                    ? "bg-rose-50 text-rose-700 border-rose-500 dark:bg-rose-950/60 dark:text-rose-300"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                    }`}
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Chưa đóng</span>
                            </button>
                        </div>
                    </div>

                    {isPaid && (
                        <>
                            <div>
                                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Thời gian đóng (Giờ Việt Nam):</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={paidAt}
                                    onChange={(e) => setPaidAt(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 font-medium"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Hình thức thanh toán:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("Tiền mặt")}
                                        className={`py-2 px-2.5 rounded-lg font-bold border flex items-center justify-center space-x-1.5 transition-colors ${paymentMethod === "Tiền mặt"
                                            ? "bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-950/60 dark:text-blue-300"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                            }`}
                                    >
                                        <Banknote className="w-4 h-4" />
                                        <span>Tiền mặt</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("Chuyển khoản")}
                                        className={`py-2 px-2.5 rounded-lg font-bold border flex items-center justify-center space-x-1.5 transition-colors ${paymentMethod === "Chuyển khoản"
                                            ? "bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-950/60 dark:text-blue-300"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                            }`}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        <span>Chuyển khoản</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-semibold transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-1.5 rounded-lg text-white bg-red-600 hover:bg-red-700 font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isPending ? "Đang lưu..." : "Lưu thay đổi"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
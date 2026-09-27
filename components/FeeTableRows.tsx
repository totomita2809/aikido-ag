"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Eye, X } from "lucide-react";
import FeeRowEditPanel from "@/components/FeeRowEditPanel";

export interface StudentRow {
    id: string;
    studentCode: string;
    fullName: string;
    avatar?: string | null;
    dojo?: string;
    feeConfig: {
        amount: number;
        cycleLabel: string;
        dojoName: string;
    };
    isPaid: boolean;
    paidAt?: Date | null;
    amount?: number;
    paymentMethod?: string | null;
    receiptUrl?: string | null;
    month: number;
    year: number;
}

interface FeeTableRowsProps {
    students: StudentRow[];
    isSuperAdmin?: boolean;
}

export default function FeeTableRows({ students, isSuperAdmin = false }: FeeTableRowsProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleToggleExpand = (id: string) => {
        if (!isSuperAdmin) return;
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => {
                    const isExpanded = expandedId === student.id;

                    return (
                        <React.Fragment key={student.id}>
                            <tr
                                onClick={() => handleToggleExpand(student.id)}
                                className={`transition-colors ${isSuperAdmin ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40" : ""} ${isExpanded ? "bg-red-50/20 dark:bg-red-950/10" : ""}`}
                            >
                                {/* Cột Môn sinh (Hiển thị ảnh thẻ Avatar chuẩn có sẵn) */}
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                            {student.avatar ? (
                                                <Image
                                                    src={student.avatar}
                                                    alt={student.fullName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-500 uppercase">
                                                    {student.fullName.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                                {student.fullName}
                                            </p>
                                            <span className="font-mono text-xs text-slate-500 font-semibold">
                                                {student.studentCode}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Cột Sân tập */}
                                <td className="px-5 py-3.5">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${student.dojo === "TACHI"
                                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                            : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"
                                            }`}
                                    >
                                        {student.feeConfig.dojoName}
                                    </span>
                                </td>

                                {/* Cột Mức thu */}
                                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                                    {(student.amount || student.feeConfig.amount).toLocaleString("vi-VN")} đ
                                    <span className="text-xs text-slate-400 block font-normal">
                                        ({student.feeConfig.cycleLabel})
                                    </span>
                                </td>

                                {/* Cột Ngày đóng */}
                                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                                    {student.isPaid && student.paidAt
                                        ? new Date(student.paidAt).toLocaleDateString("vi-VN")
                                        : "—"}
                                </td>

                                {/* Cột Tình trạng & Thao tác */}
                                <td className="px-5 py-3.5 text-right">
                                    <div className="inline-flex items-center space-x-2.5">
                                        <div className="flex flex-col items-end">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${student.isPaid
                                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                                    }`}
                                            >
                                                {student.isPaid ? "Đã đóng" : "Chưa đóng"}
                                            </span>

                                            {student.receiptUrl && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewImage(student.receiptUrl || null);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-1 cursor-pointer"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    <span>Xem biên lai</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Nút Thu phí chỉ hiển thị cho SUPER_ADMIN */}
                                        {isSuperAdmin && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleExpand(student.id);
                                                }}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                            >
                                                <span>{isExpanded ? "Đóng" : "Thu phí"}</span>
                                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>

                            {/* Khung trượt xổ xuống (Panel Edit độc lập) */}
                            {isExpanded && (
                                <FeeRowEditPanel
                                    student={student}
                                    onClose={() => setExpandedId(null)}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </tbody>

            {/* Modal phóng to ảnh biên lai */}
            {previewImage && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Ảnh chứng từ / Biên lai</span>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
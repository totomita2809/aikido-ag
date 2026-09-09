"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import FeeEditModal from "@/components/FeeEditModal";
import PaymentProofModal from "@/components/PaymentProofModal";

interface StudentRow {
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
    paymentMethod?: string | null;
    receiptUrl?: string | null;
    month: number;
    year: number;
}

export default function FeeTableRows({ students }: { students: StudentRow[] }) {
    const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
    const [proofModalData, setProofModalData] = useState<{ studentId: string; fullName: string; month: number; year: number } | null>(null);

    // Kiểm tra client-side an toàn mà không cần useEffect gây cascading render
    const isClient = typeof window !== "undefined";

    return (
        <>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                    <tr
                        key={student.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {student.studentCode}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                            {student.fullName}
                        </td>
                        <td className="px-5 py-4">
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${student.dojo === "TACHI"
                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                        : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"
                                    }`}
                            >
                                {student.feeConfig.dojoName}
                            </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-medium">
                            {student.feeConfig.amount.toLocaleString("vi-VN")} đ
                            <span className="text-xs text-slate-400 block font-normal">
                                ({student.feeConfig.cycleLabel})
                            </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                            {student.isPaid && student.paidAt
                                ? new Date(student.paidAt).toLocaleDateString("vi-VN")
                                : "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center space-x-2">
                                <div className="flex flex-col items-end">
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${student.isPaid
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                            }`}
                                    >
                                        {student.isPaid ? "Đã đóng" : "Chưa đóng"}
                                    </span>
                                    {student.paymentMethod === "Chuyển khoản" && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setProofModalData({
                                                    studentId: student.id,
                                                    fullName: student.fullName,
                                                    month: student.month,
                                                    year: student.year,
                                                });
                                            }}
                                            title="Bấm vào để xem ảnh biên lai chuyển khoản"
                                            className="text-[10px] text-blue-600 dark:text-blue-400 underline mt-1 hover:text-blue-700 cursor-pointer bg-transparent border-none p-0"
                                        >
                                            Chuyển khoản
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedStudent(student);
                                    }}
                                    title="Chỉnh sửa thông tin học phí"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5 pointer-events-none" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>

            {isClient && selectedStudent && createPortal(
                <FeeEditModal
                    isOpen={!!selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    data={{
                        studentId: selectedStudent.id,
                        studentCode: selectedStudent.studentCode,
                        fullName: selectedStudent.fullName,
                        avatar: selectedStudent.avatar,
                        month: selectedStudent.month,
                        year: selectedStudent.year,
                        amount: selectedStudent.feeConfig.amount,
                        isPaid: selectedStudent.isPaid,
                        paidAt: selectedStudent.paidAt,
                        paymentMethod: selectedStudent.paymentMethod,
                    }}
                />,
                document.body
            )}

            {isClient && proofModalData && (
                <PaymentProofModal
                    isOpen={!!proofModalData}
                    onClose={() => setProofModalData(null)}
                    studentId={proofModalData.studentId}
                    studentName={proofModalData.fullName}
                    month={proofModalData.month}
                    year={proofModalData.year}
                />
            )}
        </>
    );
}
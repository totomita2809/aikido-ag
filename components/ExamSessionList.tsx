"use client";

import { useState, useTransition } from "react";
import { Calendar, MapPin, Users, Trash2, FileDown, CheckCircle2, AlertCircle } from "lucide-react";
import { generateExamDocx } from "@/lib/docxExport";
import { deleteExamSession } from "@/app/actions/exam";
import EditExamModal from "@/components/EditExamModal";
import ExamGradingModal from "@/components/ExamGradingModal";

export interface ExamSessionFull {
    id: string;
    title: string;
    examDate: Date | string;
    dojo: string;
    headCoachPresent: boolean;
    examiners: Array<{
        id: string;
        fullName: string;
        rank: string;
        role: string;
        order: number;
    }>;
    candidates: Array<{
        id: string;
        targetRank: string;
        isSpecial: boolean;
        specialReason?: string | null;
        student: {
            id: string;
            fullName: string;
            studentCode: string;
            dateOfBirth: Date | string | null;
            currentRank: string;
            dojo: string;
        };
    }>;
}

interface CoachItem {
    id: string;
    fullName: string;
    currentRank: string;
}

interface CandidateItem {
    id: string;
    studentCode: string;
    fullName: string;
    currentRank: string;
    dateOfBirth: Date | string | null;
    dojo: string;
    isEligible: boolean;
    suggestedNextRank: string;
}

interface Props {
    sessions: ExamSessionFull[];
    isSuperAdmin: boolean;
    coaches?: CoachItem[];
    candidates?: CandidateItem[];
}

export default function ExamSessionList({
    sessions,
    isSuperAdmin,
    coaches = [],
    candidates = [],
}: Props) {
    const [isPending, startTransition] = useTransition();
    const [expandedId, setExpandedId] = useState<string | null>(sessions[0]?.id || null);

    if (!sessions || sessions.length === 0) return null;

    const handleExportAgain = (exam: ExamSessionFull) => {
        const d = new Date(exam.examDate);
        const dateStr = `Ngày ${String(d.getDate()).padStart(2, "0")} tháng ${String(d.getMonth() + 1).padStart(2, "0")} năm ${d.getFullYear()}`;

        const examiners = exam.examiners.map((ex) => ({
            order: ex.order,
            fullName: ex.fullName,
            rank: ex.rank,
            role: ex.role,
        }));

        const candidatesDocx = exam.candidates.map((c, idx) => {
            let dobFormatted = "—";
            if (c.student.dateOfBirth) {
                const bd = new Date(c.student.dateOfBirth);
                dobFormatted = `${String(bd.getDate()).padStart(2, "0")}/${String(bd.getMonth() + 1).padStart(2, "0")}/${bd.getFullYear()}`;
            }

            return {
                order: idx + 1,
                fullName: c.student.fullName,
                dob: dobFormatted,
                targetRank: c.targetRank,
            };
        });

        generateExamDocx(dateStr, examiners, candidatesDocx);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-red-600" />
                <span>Kỳ Thi Thăng Cấp Đai Đang Tổ Chức ({sessions.length})</span>
            </h2>

            <div className="space-y-4">
                {sessions.map((exam) => {
                    const isExpanded = expandedId === exam.id;
                    const eligibleList = exam.candidates.filter((c) => !c.isSpecial);
                    const specialList = exam.candidates.filter((c) => c.isSpecial);

                    return (
                        <div
                            key={exam.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
                        >
                            {/* Header Thẻ Kỳ Thi */}
                            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                                            {exam.title}
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                            {exam.candidates.length} Thí sinh
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                            <Calendar className="w-3.5 h-3.5 text-red-600" />
                                            {new Date(exam.examDate).toLocaleDateString("vi-VN", {
                                                weekday: "long",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })} - {new Date(exam.examDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                            {exam.dojo === "TACHI" ? "Sân Tachi" : exam.dojo === "HAYATE" ? "Aikido Hayate" : "Cả 2 sân"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Nút Nhập điểm thi chi tiết */}
                                    <ExamGradingModal exam={exam} isSuperAdmin={isSuperAdmin} />

                                    <button
                                        type="button"
                                        onClick={() => handleExportAgain(exam)}
                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                    >
                                        <FileDown className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Xuất lại Word</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(isExpanded ? null : exam.id)}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300 hover:bg-red-100 transition-colors cursor-pointer"
                                    >
                                        {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                                    </button>

                                    {/* Nút Chỉnh Sửa Kỳ Thi Dành Riêng Cho HLV Trưởng */}
                                    {isSuperAdmin && (
                                        <EditExamModal
                                            exam={exam}
                                            coaches={coaches}
                                            candidates={candidates}
                                        />
                                    )}

                                    {isSuperAdmin && (
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => {
                                                if (confirm("Bạn có chắc chắn muốn xóa kỳ thi này?")) {
                                                    startTransition(async () => {
                                                        await deleteExamSession(exam.id);
                                                    });
                                                }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            title="Xóa kỳ thi"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chi tiết nội dung khi mở rộng */}
                            {isExpanded && (
                                <div className="p-5 space-y-5 bg-slate-50/50 dark:bg-slate-900/50">
                                    {/* 1. Ban chấm thi */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-blue-500" />
                                            <span>Hội đồng Ban chấm thi</span>
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                            {exam.examiners.map((ex) => (
                                                <div
                                                    key={ex.id}
                                                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                                                >
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{ex.fullName}</p>
                                                        <p className="text-[11px] text-slate-400">{ex.rank}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ex.role === "Chấm chính"
                                                        ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                                        }`}>
                                                        {ex.role}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Thí sinh đủ chuẩn */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Môn sinh đủ điều kiện tiêu chuẩn ({eligibleList.length})</span>
                                        </h4>
                                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs bg-white dark:bg-slate-800">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                                                    <tr>
                                                        <th className="p-2.5">Mã số</th>
                                                        <th className="p-2.5">Họ và tên</th>
                                                        <th className="p-2.5">Cơ sở</th>
                                                        <th className="p-2.5">Cấp hiện tại</th>
                                                        <th className="p-2.5 text-right font-bold text-red-600">Lên đai dự kiến</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                    {eligibleList.map((c) => (
                                                        <tr key={c.id}>
                                                            <td className="p-2.5 font-mono text-slate-500">{c.student.studentCode}</td>
                                                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{c.student.fullName}</td>
                                                            <td className="p-2.5">{c.student.dojo === "TACHI" ? "Sân Tachi" : "Hayate"}</td>
                                                            <td className="p-2.5 text-slate-500">{c.student.currentRank}</td>
                                                            <td className="p-2.5 text-right font-bold text-red-600 dark:text-red-400">{c.targetRank}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 3. Thí sinh đặc cách */}
                                    {specialList.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                <span>Môn sinh diện Đặc Cách của HLV Trưởng ({specialList.length})</span>
                                            </h4>
                                            <div className="border border-amber-200 dark:border-amber-900/60 rounded-xl overflow-hidden text-xs bg-amber-50/30 dark:bg-amber-950/20">
                                                <table className="w-full text-left">
                                                    <thead className="bg-amber-100/60 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold border-b border-amber-200 dark:border-amber-900">
                                                        <tr>
                                                            <th className="p-2.5">Mã số</th>
                                                            <th className="p-2.5">Họ và tên</th>
                                                            <th className="p-2.5">Cấp hiện tại</th>
                                                            <th className="p-2.5 text-red-600 font-bold">Lên đai</th>
                                                            <th className="p-2.5">Lý do đặc cách</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-amber-100 dark:divide-amber-900/40">
                                                        {specialList.map((c) => (
                                                            <tr key={c.id}>
                                                                <td className="p-2.5 font-mono text-slate-500">{c.student.studentCode}</td>
                                                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">{c.student.fullName}</td>
                                                                <td className="p-2.5 text-slate-500">{c.student.currentRank}</td>
                                                                <td className="p-2.5 font-bold text-red-600 dark:text-red-400">{c.targetRank}</td>
                                                                <td className="p-2.5 italic text-amber-800 dark:text-amber-300">{c.specialReason || "Đặc cách kỹ thuật"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
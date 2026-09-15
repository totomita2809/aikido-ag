"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Award,
    X,
    FileDown,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    Save,
    Lock,
    Sparkles,
} from "lucide-react";
import {
    autoSaveCandidateScores,
    saveExamScoresWithCarryOver,
    finalizeExamWithBeltPromotion,
} from "@/app/actions/exam";
import {
    generateExamResultDocx,
    roundScore,
    formatScoreVN,
    CandidateResultExportItem,
} from "@/lib/docxResultExport";
import {
    PROMOTABLE_RANKS,
    getRankPriority,
    isUnderBlackBelt,
} from "@/lib/rankRules";
import CustomDialog from "@/components/CustomDialog";
import { ExamSessionFull } from "@/components/ExamSessionList";

interface StudentExtendedInfo {
    id: string;
    fullName: string;
    studentCode: string;
    dateOfBirth: Date | string | null;
    currentRank: string;
    dojo: string;
    avatar?: string | null;
    accumulatedBonusScore?: number;
    bonusScoreNote?: string | null;
}

interface ExamCandidateExtended {
    id: string;
    targetRank: string;
    isSpecial: boolean;
    specialReason?: string | null;
    ukeCount?: number;
    usedBonusScore?: number;
    overflowScore?: number;
    promotedRank?: string | null;
    student: StudentExtendedInfo;
}

interface ExamSessionExtended extends Omit<ExamSessionFull, "candidates"> {
    candidates: ExamCandidateExtended[];
}

interface Props {
    exam: ExamSessionExtended;
    isSuperAdmin: boolean;
}

interface JudgeScoreItem {
    examinerId: string;
    examinerName: string;
    role: string;
    score: number | string;
}

interface CandidateGradingState {
    candidateId: string;
    studentId: string;
    fullName: string;
    studentCode: string;
    dobStr: string;
    avatar: string | null;
    currentRank: string;
    targetRank: string;
    promotedRank: string;
    judgeScores: JudgeScoreItem[];
    ukeCount: number;
    usedBonusScore: number;
    bonusNote: string | null;
    rawScore: number;
    finalScore: number;
    overflowScore: number;
    titleHonor: string;
    isPassed: boolean;
    notes: string;
}

interface DialogState {
    isOpen: boolean;
    type: "INFO" | "SUCCESS" | "WARNING" | "CONFIRM";
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    customContent?: React.ReactNode;
}

function computeCandidateScores(list: CandidateGradingState[]): CandidateGradingState[] {
    const computed = list.map((c) => {
        const validScores = c.judgeScores.map((j) => {
            const num = typeof j.score === "number" ? j.score : parseFloat(String(j.score)) || 0;
            return Math.min(10, Math.max(0, num));
        });
        const sumJudge = validScores.reduce((acc, cur) => acc + cur, 0);
        const avg = validScores.length > 0 ? sumJudge / validScores.length : 0;
        const ukeBonus = (Number(c.ukeCount) || 0) * 0.5;
        const carryOverBonus = Number(c.usedBonusScore) || 0;

        const raw = roundScore(avg + ukeBonus + carryOverBonus);
        const canCarryOver = isUnderBlackBelt(c.targetRank);

        let final = raw;
        let overflow = 0;

        if (raw > 10.0 && canCarryOver) {
            final = 10.0;
            overflow = roundScore(raw - 10.0);
        } else if (raw > 10.0 && !canCarryOver) {
            final = 10.0;
            overflow = 0;
        }

        const passed = final >= 5.0;

        return {
            ...c,
            rawScore: raw,
            finalScore: final,
            overflowScore: overflow,
            isPassed: passed,
            titleHonor: passed ? "" : "Không đủ điều kiện lên đai",
        };
    });

    const passedCandidates = computed
        .filter((c) => c.isPassed)
        .sort((a, b) => b.finalScore - a.finalScore);

    if (passedCandidates.length > 0) {
        const top1 = passedCandidates[0].finalScore;
        const top2 = passedCandidates.find((c) => c.finalScore < top1)?.finalScore;
        const top3 = top2 !== undefined ? passedCandidates.find((c) => c.finalScore < top2)?.finalScore : undefined;

        computed.forEach((c) => {
            if (c.isPassed) {
                if (c.finalScore === top1) {
                    c.titleHonor = "THỦ KHOA";
                } else if (top2 !== undefined && c.finalScore === top2) {
                    c.titleHonor = "Á KHOA";
                } else if (top3 !== undefined && c.finalScore === top3) {
                    c.titleHonor = "QUÝ KHOA";
                }
            }
        });
    }

    return computed;
}

export default function ExamGradingModal({ exam, isSuperAdmin }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSavedAtLeastOnce, setIsSavedAtLeastOnce] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const [dialog, setDialog] = useState<DialogState>({
        isOpen: false,
        type: "INFO",
        title: "",
        message: "",
    });

    const closeDialog = () => setDialog((prev) => ({ ...prev, isOpen: false }));

    const [showCrashAlert, setShowCrashAlert] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return Boolean(localStorage.getItem(`aikido_exam_grading_draft_${exam.id}`));
        }
        return false;
    });

    const activeJudges = exam.examiners.filter(
        (ex) => !ex.role.toLowerCase().includes("giám sát")
    );

    const [candidates, setCandidates] = useState<CandidateGradingState[]>(() => {
        if (typeof window !== "undefined") {
            const cacheKey = `aikido_exam_grading_draft_${exam.id}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached) as CandidateGradingState[];
                    if (Array.isArray(parsed) && parsed.length === exam.candidates.length) {
                        const validated = parsed.map((item) => {
                            const curPriority = getRankPriority(item.currentRank);
                            const promPriority = getRankPriority(item.promotedRank);
                            if (promPriority <= curPriority) {
                                const nextHigher = PROMOTABLE_RANKS.find((r) => getRankPriority(r) > curPriority);
                                return {
                                    ...item,
                                    promotedRank: nextHigher || item.currentRank,
                                };
                            }
                            return item;
                        });
                        return computeCandidateScores(validated);
                    }
                } catch {
                    // Fallback
                }
            }
        }

        const initialList: CandidateGradingState[] = exam.candidates.map((c) => {
            let dobFormatted = "—";
            if (c.student.dateOfBirth) {
                const bd = new Date(c.student.dateOfBirth);
                dobFormatted = `${String(bd.getDate()).padStart(2, "0")}/${String(
                    bd.getMonth() + 1
                ).padStart(2, "0")}/${bd.getFullYear()}`;
            }

            const initialJudges: JudgeScoreItem[] = activeJudges.map((j) => ({
                examinerId: j.id,
                examinerName: j.fullName,
                role: j.role,
                score: 0,
            }));

            const oldBonus = Number(c.student.accumulatedBonusScore) || Number(c.usedBonusScore) || 0;
            const currentPriority = getRankPriority(c.student.currentRank);

            const higherRanks = PROMOTABLE_RANKS.filter((r) => getRankPriority(r) > currentPriority);

            let defaultPromote = c.promotedRank || c.targetRank;
            if (getRankPriority(defaultPromote) <= currentPriority) {
                defaultPromote = higherRanks.length > 0 ? higherRanks[0] : c.student.currentRank;
            }

            return {
                candidateId: c.id,
                studentId: c.student.id,
                fullName: c.student.fullName,
                studentCode: c.student.studentCode,
                dobStr: dobFormatted,
                avatar: c.student.avatar || null,
                currentRank: c.student.currentRank,
                targetRank: c.targetRank,
                promotedRank: defaultPromote,
                judgeScores: initialJudges,
                ukeCount: c.ukeCount || 0,
                usedBonusScore: oldBonus,
                bonusNote: c.student.bonusScoreNote || null,
                rawScore: 0.0 + oldBonus,
                finalScore: Math.min(10.0, oldBonus),
                overflowScore: Math.max(0, roundScore(oldBonus - 10.0)),
                titleHonor: "",
                isPassed: true,
                notes: "",
            };
        });

        return computeCandidateScores(initialList);
    });

    // Tự động kiểm tra và refresh dữ liệu mới nhất từ database mỗi khi mở modal
    useEffect(() => {
        if (isOpen) {
            router.refresh();
        }
    }, [isOpen, router]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const triggerAutoSave = useCallback(
        (updated: CandidateGradingState[]) => {
            if (isLocked) return;
            setHasUnsavedChanges(true);
            localStorage.setItem(`aikido_exam_grading_draft_${exam.id}`, JSON.stringify(updated));

            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(async () => {
                setIsAutoSaving(true);
                try {
                    await autoSaveCandidateScores({
                        examId: exam.id,
                        candidateScores: updated.map((c) => ({
                            candidateId: c.candidateId,
                            ukeCount: c.ukeCount,
                            usedBonusScore: c.usedBonusScore,
                            overflowScore: c.overflowScore,
                            judgeScores: c.judgeScores.map((j) => ({
                                examinerId: j.examinerId,
                                examinerName: j.examinerName,
                                score: typeof j.score === "number" ? j.score : parseFloat(String(j.score)) || 0,
                            })),
                            finalScore: c.finalScore,
                            resultStatus: isSuperAdmin
                                ? (c.isPassed ? "PASSED" : "FAILED")
                                : "PENDING_APPROVAL",
                            titleHonor: c.titleHonor,
                            notes: c.notes,
                            promotedRank: c.promotedRank,
                        })),
                    });
                    setHasUnsavedChanges(false);
                } catch {
                    // Giữ nguyên cờ chưa lưu
                } finally {
                    setIsAutoSaving(false);
                }
            }, 1200);
        },
        [exam.id, isLocked, isSuperAdmin]
    );

    const updateJudgeScore = (candidateId: string, examinerId: string, val: string) => {
        if (isLocked) return;
        let sanitized = val;
        if (val !== "") {
            const num = parseFloat(val);
            if (isNaN(num)) sanitized = "0";
            else if (num < 0) sanitized = "0";
            else if (num > 10) sanitized = "10";
        }

        const updated = candidates.map((c) => {
            if (c.candidateId !== candidateId) return c;
            const nextJudges = c.judgeScores.map((j) =>
                j.examinerId === examinerId ? { ...j, score: sanitized } : j
            );
            return { ...c, judgeScores: nextJudges };
        });
        const recalculated = computeCandidateScores(updated);
        setCandidates(recalculated);
        triggerAutoSave(recalculated);
    };

    const updateUkeCount = (candidateId: string, val: number) => {
        if (isLocked) return;
        const count = Math.max(0, val);
        const updated = candidates.map((c) =>
            c.candidateId === candidateId ? { ...c, ukeCount: count } : c
        );
        const recalculated = computeCandidateScores(updated);
        setCandidates(recalculated);
        triggerAutoSave(recalculated);
    };

    const updatePromotedRank = (candidateId: string, newRank: string) => {
        if (!isSuperAdmin || isLocked) return;
        const updated = candidates.map((c) =>
            c.candidateId === candidateId ? { ...c, promotedRank: newRank } : c
        );
        setCandidates(updated);
        triggerAutoSave(updated);
    };

    const updateNotes = (candidateId: string, val: string) => {
        if (isLocked) return;
        const updated = candidates.map((c) =>
            c.candidateId === candidateId ? { ...c, notes: val } : c
        );
        setCandidates(updated);
        triggerAutoSave(updated);
    };

    const handleSaveManual = async () => {
        // Chống spam: Nếu không có dữ liệu nào mới được sửa đổi
        if (!hasUnsavedChanges && isSavedAtLeastOnce) {
            setDialog({
                isOpen: true,
                type: "INFO",
                title: "Dữ liệu chưa thay đổi",
                message: "Bảng điểm hiện tại đã được gửi lên hệ thống và không có điểm số nào mới thay đổi. Không cần gửi lại để tránh trùng lặp.",
                confirmText: "Đã hiểu",
            });
            return;
        }

        setIsSavingManual(true);
        try {
            await saveExamScoresWithCarryOver({
                examId: exam.id,
                examTitle: exam.title,
                candidateScores: candidates.map((c) => ({
                    candidateId: c.candidateId,
                    studentId: c.studentId,
                    ukeCount: c.ukeCount,
                    usedBonusScore: c.usedBonusScore,
                    overflowScore: c.overflowScore,
                    judgeScores: c.judgeScores.map((j) => ({
                        examinerId: j.examinerId,
                        examinerName: j.examinerName,
                        score: typeof j.score === "number" ? j.score : parseFloat(String(j.score)) || 0,
                    })),
                    finalScore: c.finalScore,
                    resultStatus: isSuperAdmin
                        ? (c.isPassed ? "PASSED" : "FAILED")
                        : "PENDING_APPROVAL",
                    titleHonor: c.titleHonor,
                    notes: c.notes,
                    promotedRank: c.promotedRank,
                })),
            });
            setHasUnsavedChanges(false);
            setIsSavedAtLeastOnce(true);

            const overflowStudents = candidates.filter((c) => c.overflowScore > 0);

            if (overflowStudents.length > 0) {
                setDialog({
                    isOpen: true,
                    type: "SUCCESS",
                    title: isSuperAdmin ? "Lưu thành công & Điểm bảo lưu" : "Đã gửi bảng điểm chờ HLV Trưởng duyệt",
                    message: isSuperAdmin
                        ? "Bảng điểm đã được lưu. Các môn sinh sau có điểm vượt trần (trên 10.0) được bảo lưu tự động vào hồ sơ cho kỳ thi sau:"
                        : "Bảng điểm đã được lưu và chuyển về HLV Trưởng để duyệt chính thức. Điểm vượt trần dự kiến được bảo lưu:",
                    confirmText: "Đồng ý",
                    customContent: (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                                    <tr>
                                        <th className="p-2">Mã số</th>
                                        <th className="p-2">Họ và tên</th>
                                        <th className="p-2 text-center">Tổng điểm</th>
                                        <th className="p-2 text-center text-red-600">Điểm thi</th>
                                        <th className="p-2 text-right text-emerald-600 font-extrabold">Bảo lưu kỳ sau</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {overflowStudents.map((s) => (
                                        <tr key={s.candidateId}>
                                            <td className="p-2 font-mono">{s.studentCode}</td>
                                            <td className="p-2 font-bold">{s.fullName}</td>
                                            <td className="p-2 text-center">{s.rawScore}</td>
                                            <td className="p-2 text-center font-bold text-red-600">10.0</td>
                                            <td className="p-2 text-right font-black text-emerald-600">+{s.overflowScore}đ</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ),
                });
            } else {
                setDialog({
                    isOpen: true,
                    type: "SUCCESS",
                    title: isSuperAdmin ? "Lưu hoàn tất" : "Đã gửi bảng điểm",
                    message: isSuperAdmin
                        ? "Đã lưu bảng điểm thành công vào hệ thống!"
                        : "Huấn luyện viên đã lưu và gửi bảng điểm thành công, đang đợi HLV Trưởng phê duyệt chính thức!",
                    confirmText: "Đóng",
                });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Lỗi khi lưu điểm!";
            setDialog({
                isOpen: true,
                type: "WARNING",
                title: "Lỗi lưu dữ liệu",
                message: msg,
                confirmText: "Đóng",
            });
        } finally {
            setIsSavingManual(false);
        }
    };

    const handleLockAndFinalizeExam = () => {
        const passedList = candidates.filter((c) => c.isPassed);

        setDialog({
            isOpen: true,
            type: "CONFIRM",
            title: "Xác nhận chốt kỳ thi & Thăng cấp đai",
            message:
                "Lưu ý: Khi đã chốt kỳ thi, toàn bộ kết quả sẽ được khóa vĩnh viễn và không thể chỉnh sửa điểm số được nữa. Hệ thống sẽ chính thức thăng cấp đai cho các môn sinh đạt điều kiện. Thầy có chắc chắn muốn chốt kỳ thi này?\n\n" +
                `• Số môn sinh ĐẠT: ${passedList.length}/${candidates.length}`,
            confirmText: "Chốt kỳ thi ngay",
            cancelText: "Hủy bỏ",
            onConfirm: () => {
                startTransition(async () => {
                    try {
                        await finalizeExamWithBeltPromotion({
                            examId: exam.id,
                            promotions: candidates.map((c) => ({
                                candidateId: c.candidateId,
                                studentId: c.studentId,
                                targetRank: c.targetRank,
                                assignedRank: c.promotedRank,
                                isPassed: c.isPassed,
                                finalScore: c.finalScore,
                                titleHonor: c.titleHonor,
                            })),
                        });
                        localStorage.removeItem(`aikido_exam_grading_draft_${exam.id}`);
                        setHasUnsavedChanges(false);
                        setIsLocked(true);

                        setDialog({
                            isOpen: true,
                            type: "SUCCESS",
                            title: "Hoàn tất kỳ thi",
                            message: `Đã chốt kỳ thi và hoàn tất nâng cấp đai cho ${passedList.length} môn sinh!`,
                            confirmText: "Trở về danh sách",
                            onConfirm: () => {
                                setIsOpen(false);
                                router.push("/promotions");
                            },
                        });
                    } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi!";
                        setDialog({
                            isOpen: true,
                            type: "WARNING",
                            title: "Lỗi chốt kỳ thi",
                            message: msg,
                            confirmText: "Đóng",
                        });
                    }
                });
            },
        });
    };

    const handleExportResultWord = () => {
        const sorted = [...candidates].sort((a, b) => {
            const pA = getRankPriority(a.currentRank);
            const pB = getRankPriority(b.currentRank);
            if (pA !== pB) return pA - pB;
            return b.finalScore - a.finalScore;
        });

        const exportItems: CandidateResultExportItem[] = sorted.map((c, idx) => ({
            order: idx + 1,
            fullName: c.fullName,
            dob: c.dobStr,
            currentRank: c.currentRank,
            targetRank: c.promotedRank || c.targetRank,
            score: c.finalScore,
            titleHonor: c.titleHonor,
            isPassed: c.isPassed,
        }));

        generateExamResultDocx(new Date(exam.examDate), exportItems);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
                <Award className="w-3.5 h-3.5" />
                <span>Nhập điểm thi</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl max-w-7xl w-full flex flex-col max-h-[94vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {/* Header ghim trên cùng */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                        Bảng Chấm Điểm Kỳ Thi
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                        {candidates.length} môn sinh
                                    </span>
                                    {isAutoSaving && (
                                        <span className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            <span>Đang tự động lưu...</span>
                                        </span>
                                    )}
                                    {!isAutoSaving && !hasUnsavedChanges && (
                                        <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Đã đồng bộ</span>
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {exam.title} • {activeJudges.length} giám khảo chấm điểm thực tế • Thang điểm 0 - 10
                                    {!isSuperAdmin && " • Quyền HLV: Nhập điểm và gửi duyệt"}
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={handleExportResultWord}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                                >
                                    <FileDown className="w-4 h-4" />
                                    <span>Xuất biên bản Word</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={isSavingManual || isLocked}
                                    onClick={handleSaveManual}
                                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {isSavingManual ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    <span>{isSuperAdmin ? "Lưu" : "Lưu & Gửi HLV Trưởng duyệt"}</span>
                                </button>

                                {isSuperAdmin && (isSavedAtLeastOnce || !hasUnsavedChanges) && (
                                    <button
                                        type="button"
                                        disabled={isPending || isLocked}
                                        onClick={handleLockAndFinalizeExam}
                                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer animate-in fade-in"
                                    >
                                        {isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Lock className="w-4 h-4" />
                                        )}
                                        <span>Chốt kỳ thi</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (hasUnsavedChanges) {
                                            setDialog({
                                                isOpen: true,
                                                type: "CONFIRM",
                                                title: "Dữ liệu chưa lưu",
                                                message: "Bạn có các thay đổi chưa đồng bộ xong, bạn có chắc chắn muốn đóng?",
                                                confirmText: "Vẫn đóng",
                                                cancelText: "Ở lại",
                                                onConfirm: () => setIsOpen(false),
                                            });
                                            return;
                                        }
                                        setIsOpen(false);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {showCrashAlert && (
                            <div className="px-4 py-2 bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between border-b border-amber-200 dark:border-amber-800">
                                <div className="flex items-center space-x-1.5">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>
                                        Đã tự động khôi phục dữ liệu chấm thi từ phiên làm việc trước do sự cố tắt máy/mất điện.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCrashAlert(false)}
                                    className="text-amber-700 font-bold hover:underline cursor-pointer"
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        )}

                        {/* Danh sách thẻ môn sinh */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {candidates.map((st) => (
                                <div
                                    key={st.candidateId}
                                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col xl:flex-row xl:items-start justify-between gap-5"
                                >
                                    {/* CỘT 1: THÔNG TIN MÔN SINH, UKE & ĐIỂM THI */}
                                    <div className="flex flex-col space-y-3 min-w-[280px] shrink-0">
                                        <div className="flex items-start space-x-3.5">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 relative border border-slate-200 dark:border-slate-600 shrink-0 flex items-center justify-center">
                                                {st.avatar ? (
                                                    <Image src={st.avatar} alt={st.fullName} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-base font-bold text-slate-500 uppercase">
                                                        {st.fullName.charAt(0)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                                        {st.fullName}
                                                    </h3>
                                                    {st.titleHonor && (
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${st.titleHonor === "THỦ KHOA"
                                                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                                                : st.titleHonor === "Á KHOA"
                                                                    ? "bg-slate-200 text-slate-800"
                                                                    : st.titleHonor === "QUÝ KHOA"
                                                                        ? "bg-orange-100 text-orange-800"
                                                                        : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {st.titleHonor}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                                                    <span className="font-mono font-semibold">{st.studentCode}</span>
                                                    <span>•</span>
                                                    <span>{st.dobStr}</span>
                                                </div>

                                                {st.usedBonusScore > 0 && (
                                                    <div
                                                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold cursor-help"
                                                        title={st.bonusNote || `Điểm tích lũy từ kỳ trước: +${st.usedBonusScore}đ`}
                                                    >
                                                        <Sparkles className="w-3 h-3" />
                                                        <span>Tích lũy cũ: +{st.usedBonusScore}đ</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-2 pt-1">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        {st.currentRank}
                                                    </span>
                                                    <span className="font-bold text-red-600">➔</span>
                                                    {isSuperAdmin && !isLocked ? (
                                                        <select
                                                            value={st.promotedRank}
                                                            onChange={(e) => updatePromotedRank(st.candidateId, e.target.value)}
                                                            className="px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs outline-hidden transition-colors cursor-pointer bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:border-red-500 dark:hover:border-red-500 focus:ring-2 focus:ring-red-500"
                                                        >
                                                            {PROMOTABLE_RANKS
                                                                .filter((r) => getRankPriority(r) > getRankPriority(st.currentRank))
                                                                .map((r) => (
                                                                    <option
                                                                        key={r}
                                                                        value={r}
                                                                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1.5"
                                                                    >
                                                                        {r}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    ) : (
                                                        <span className="font-bold text-red-600 dark:text-red-400 text-xs">
                                                            {st.promotedRank}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Khối Làm Uke và Điểm thi */}
                                        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                            <div className="space-y-1 text-center shrink-0">
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                                                    Số lần làm Uke:
                                                </span>
                                                <div className="flex items-center space-x-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        disabled={isLocked}
                                                        value={st.ukeCount}
                                                        onChange={(e) =>
                                                            updateUkeCount(st.candidateId, parseInt(e.target.value, 10) || 0)
                                                        }
                                                        className="w-12 px-1 py-1 text-center font-bold text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
                                                    />
                                                    <span className="text-[10px] font-semibold text-emerald-600">
                                                        +{st.ukeCount * 0.5}đ
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-center px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 min-w-[85px] shrink-0">
                                                <span className="text-[10px] font-bold text-red-600 uppercase block">
                                                    Điểm thi
                                                </span>
                                                <span className="text-base font-black text-red-700 dark:text-red-400">
                                                    {formatScoreVN(st.finalScore)}
                                                </span>
                                                {st.overflowScore > 0 && (
                                                    <span className="block text-[9px] font-bold text-emerald-600 mt-0.5">
                                                        (Dư +{st.overflowScore}đ)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CỘT 2: CHẤM ĐIỂM GIÁM KHẢO */}
                                    <div className="flex-1 w-full xl:max-w-md xl:px-4">
                                        <div className="flex flex-col space-y-2 w-full">
                                            {st.judgeScores.map((j) => (
                                                <div
                                                    key={j.examinerId}
                                                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between gap-3 shadow-2xs"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                                                            <span
                                                                className="text-xs font-bold text-slate-800 dark:text-slate-100 break-words whitespace-normal leading-tight"
                                                                title={j.examinerName}
                                                            >
                                                                {j.examinerName}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider shrink-0">
                                                                ({j.role})
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 flex items-center space-x-1.5">
                                                        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Điểm:</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            step="0.1"
                                                            disabled={isLocked}
                                                            value={j.score}
                                                            onChange={(e) =>
                                                                updateJudgeScore(st.candidateId, j.examinerId, e.target.value)
                                                            }
                                                            className="w-16 sm:w-20 px-2 py-1 text-center font-black text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-inner focus:outline-hidden focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CỘT 3: KHUNG GHI CHÚ */}
                                    <div className="flex-1 w-full xl:w-72 min-w-0 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-700 pt-3 xl:pt-0 xl:pl-4">
                                        <div className="space-y-1.5 w-full">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                Ghi chú kỹ thuật:
                                            </span>
                                            <textarea
                                                rows={4}
                                                disabled={isLocked}
                                                value={st.notes}
                                                onChange={(e) => updateNotes(st.candidateId, e.target.value)}
                                                placeholder="Ghi chú..."
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-red-500 disabled:opacity-60 resize-y"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <CustomDialog config={{ ...dialog, onClose: closeDialog }} />
        </>
    );
}
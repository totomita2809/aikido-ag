"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserCheck, Image as ImageIcon, UserPlus, Edit3, X, Shield, Clock, User, Check, ArrowRight, Award, XCircle } from "lucide-react";
import { handleAvatarApproval, handleCreationApproval, handleEditApproval } from "@/app/actions/approval";
import { finalizeExamWithBeltPromotion, rejectExamScores } from "@/app/actions/exam";
import ExamGradingModal from "@/components/ExamGradingModal";
import { ExamSessionFull } from "@/components/ExamSessionList";

interface Props {
    pendingAvatars: Array<{
        id: string;
        studentCode: string;
        fullName: string;
        pendingAvatar: string | null;
        currentRank: string;
        dojo: string;
        updatedAt?: Date;
    }>;
    pendingCreations: Array<{
        id: string;
        studentCode: string;
        fullName: string;
        currentRank: string;
        dojo: string;
        phone: string | null;
        email?: string | null;
        title?: string;
        creatorName?: string | null;
        creatorCode?: string | null;
        createdAt: Date;
        coachPermission?: Record<string, string> | null;
    }>;
    pendingEdits: Array<{
        id: string;
        studentId: string;
        coachName: string;
        coachCode?: string | null;
        changedData: string;
        createdAt: Date;
        student: {
            id: string;
            studentCode: string;
            fullName: string;
            currentRank: string;
            dojo: string;
            phone: string | null;
            parentPhone: string | null;
            email: string | null;
            gender: string | null;
            dateOfBirth: Date | null;
            joinDate: Date | null;
            address: string | null;
            healthNote: string | null;
            status: string;
            title?: string;
            coachPermission?: Record<string, string> | null;
        };
    }>;
    pendingExams?: ExamSessionFull[];
}

const ALL_STUDENT_KEYS = [
    "fullName",
    "studentCode",
    "currentRank",
    "dojo",
    "dateOfBirth",
    "gender",
    "phone",
    "parentPhone",
    "email",
    "joinDate",
    "status",
    "title",
    "address",
    "healthNote",
] as const;

const FIELD_LABELS: Record<string, string> = {
    fullName: "Họ và tên",
    studentCode: "Mã môn sinh",
    currentRank: "Cấp đai",
    dojo: "Sân tập trực thuộc",
    dateOfBirth: "Ngày sinh",
    gender: "Giới tính",
    phone: "Số điện thoại",
    parentPhone: "Số điện thoại phụ huynh",
    email: "Địa chỉ Email",
    joinDate: "Ngày nhập môn",
    status: "Trạng thái tập luyện",
    title: "Chức vụ võ đường",
    address: "Địa chỉ cư trú",
    healthNote: "Lưu ý sức khỏe / Bệnh lý",
};

const PERMISSION_LABELS: Record<string, string> = {
    canCreateStudent: "Thêm môn sinh",
    canEditFullName: "Sửa họ tên",
    canEditRank: "Sửa cấp đai",
    canEditDojo: "Sửa sân tập",
    canEditDob: "Sửa ngày sinh",
    canEditGender: "Sửa giới tính",
    canEditPhone: "Sửa SĐT",
    canEditAddress: "Sửa địa chỉ",
    canEditHealth: "Sửa sức khỏe",
    canEditStatus: "Sửa trạng thái",
};

const TITLE_NAMES: Record<string, string> = {
    MEMBER: "Môn sinh (MEMBER)",
    FUKU_SHIDOSHA: "Lớp phó (FUKU_SHIDOSHA)",
    SHIDOSHA: "Lớp trưởng (SHIDOSHA)",
    SHIDOIN: "Huấn luyện viên (SHIDOIN)",
};

const STATUS_NAMES: Record<string, string> = {
    ACTIVE: "Đang tập luyện",
    PAUSED: "Tạm nghỉ",
    INACTIVE: "Đã dừng tập",
};

function formatVNValue(key: string, val: unknown): string {
    if (val === null || val === undefined || val === "") return "—";
    if (key === "title") return TITLE_NAMES[String(val)] || String(val);
    if (key === "status") return STATUS_NAMES[String(val)] || String(val);
    if (key === "dojo") return val === "TACHI" ? "Sân Tachi (TC)" : "Aikido Hayate (HYT)";

    if (key === "dateOfBirth" || key === "joinDate") {
        if (typeof val === "string" && val.includes("/")) return val;
        const d = new Date(val as string | Date);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }

    return String(val);
}

function formatVNTime(dateInput?: Date | string | null) {
    if (!dateInput) return "—";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(d);
}

// FORM CHUNG: Modal Nhập Lý Do Từ Chối Tái Sử Dụng
function CommonRejectModal({
    isOpen,
    title,
    placeholder,
    reason,
    isPending,
    onChangeReason,
    onConfirm,
    onClose,
}: {
    isOpen: boolean;
    title: string;
    placeholder?: string;
    reason: string;
    isPending: boolean;
    onChangeReason: (val: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>{title}</span>
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Vui lòng nhập lý do từ chối để phản hồi lại cho Huấn luyện viên nắm rõ:
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => onChangeReason(e.target.value)}
                    rows={3}
                    placeholder={placeholder || "Nhập lý do cụ thể..."}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500 resize-none"
                />
                <div className="flex justify-end space-x-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={onConfirm}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Xác nhận từ chối
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ApprovalsClient({
    pendingAvatars,
    pendingCreations,
    pendingEdits,
    pendingExams = [],
}: Props) {
    const router = useRouter();
    const defaultTab = pendingExams.length > 0 ? "EXAMS" : "AVATARS";
    const [tab, setTab] = useState<"AVATARS" | "CREATIONS" | "EDITS" | "EXAMS">(defaultTab);
    const [isPending, startTransition] = useTransition();

    // Quản lý Modal từ chối dùng chung
    const [rejectModal, setRejectModal] = useState<{ id: string; type: "AVATAR" | "CREATION" | "EDIT" | "EXAM" } | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const [actionResultModal, setActionResultModal] = useState<{
        type: "SUCCESS" | "ERROR";
        title: string;
        message: string;
    } | null>(null);

    const [selectedTitles, setSelectedTitles] = useState<Record<string, string>>({});
    const [activePermissions, setActivePermissions] = useState<Record<string, Record<string, string>>>({});

    const handleTitleChange = (targetId: string, newTitle: string) => {
        setSelectedTitles((prev) => ({ ...prev, [targetId]: newTitle }));
    };

    const handlePermChange = (targetId: string, field: string, val: string, defaultObj?: Record<string, string> | null) => {
        setActivePermissions((prev) => ({
            ...prev,
            [targetId]: {
                ...(prev[targetId] || defaultObj || {}),
                [field]: val,
            },
        }));
    };

    const confirmReject = () => {
        if (!rejectModal) return;
        startTransition(async () => {
            if (rejectModal.type === "AVATAR") {
                await handleAvatarApproval(rejectModal.id, "REJECT", rejectReason);
            } else if (rejectModal.type === "CREATION") {
                await handleCreationApproval(rejectModal.id, "REJECT", rejectReason);
            } else if (rejectModal.type === "EDIT") {
                await handleEditApproval(rejectModal.id, "REJECT", rejectReason);
            } else if (rejectModal.type === "EXAM") {
                await rejectExamScores(rejectModal.id, rejectReason);
            }
            setRejectModal(null);
            setRejectReason("");
            router.refresh();
        });
    };

    const handleApproveExamScores = (exam: ExamSessionFull) => {
        const pendingCandidates = exam.candidates.filter(
            (c) => (c as unknown as { resultStatus?: string }).resultStatus === "PENDING_APPROVAL"
        );

        if (!confirm(`Thầy có chắc chắn muốn duyệt bảng điểm và phong đai cho ${pendingCandidates.length} thí sinh của kỳ thi "${exam.title}"?`)) {
            return;
        }

        startTransition(async () => {
            try {
                await finalizeExamWithBeltPromotion({
                    examId: exam.id,
                    promotions: pendingCandidates.map((c) => {
                        const candidateData = c as unknown as {
                            finalScore?: number;
                            promotedRank?: string;
                            titleHonor?: string;
                        };
                        const score = candidateData.finalScore ?? 0;
                        return {
                            candidateId: c.id,
                            studentId: c.student.id,
                            targetRank: c.targetRank,
                            assignedRank: candidateData.promotedRank || c.targetRank,
                            isPassed: score >= 5.0,
                            finalScore: score,
                            titleHonor: candidateData.titleHonor,
                        };
                    }),
                });
                setActionResultModal({
                    type: "SUCCESS",
                    title: "Duyệt kỳ thi thành công!",
                    message: `Đã phê duyệt bảng điểm và hoàn tất phong cấp đai mới cho toàn bộ thí sinh.`,
                });
                router.refresh();
                setTimeout(() => setActionResultModal(null), 2500);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Lỗi khi duyệt kỳ thi";
                setActionResultModal({
                    type: "ERROR",
                    title: "Lỗi duyệt điểm",
                    message,
                });
            }
        });
    };

    const totalExamCandidates = pendingExams.reduce((sum, e) => {
        const count = e.candidates.filter(
            (c) => (c as unknown as { resultStatus?: string }).resultStatus === "PENDING_APPROVAL"
        ).length;
        return sum + count;
    }, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg">
                    <UserCheck className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Trung Tâm Duyệt Tác Vụ</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Kiểm tra, chỉnh sửa điểm thi và phê duyệt các tác vụ của Huấn luyện viên</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
                <button
                    onClick={() => setTab("EXAMS")}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${tab === "EXAMS" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                >
                    <Award className="w-4 h-4" />
                    <span>Điểm thi ({totalExamCandidates})</span>
                </button>

                <button
                    onClick={() => setTab("AVATARS")}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${tab === "AVATARS" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    <span>Ảnh thẻ ({pendingAvatars.length})</span>
                </button>

                <button
                    onClick={() => setTab("CREATIONS")}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${tab === "CREATIONS" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Môn sinh mới ({pendingCreations.length})</span>
                </button>

                <button
                    onClick={() => setTab("EDITS")}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${tab === "EDITS" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                >
                    <Edit3 className="w-4 h-4" />
                    <span>Yêu cầu sửa đổi ({pendingEdits.length})</span>
                </button>
            </div>

            {/* TAB: ĐIỂM THI CHỜ DUYỆT */}
            {tab === "EXAMS" && (
                <div className="space-y-4">
                    {pendingExams.length === 0 ? (
                        <p className="text-sm text-slate-500 py-8 text-center">Không có bảng điểm kỳ thi nào đang chờ duyệt.</p>
                    ) : (
                        pendingExams.map((exam) => {
                            const pendingCandidates = exam.candidates.filter(
                                (c) => (c as unknown as { resultStatus?: string }).resultStatus === "PENDING_APPROVAL"
                            );

                            return (
                                <div key={exam.id} className="p-5 border rounded-2xl bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-base text-slate-900 dark:text-white">{exam.title}</span>
                                                <span className="font-mono text-xs font-bold text-red-600 px-2 py-0.5 bg-red-50 dark:bg-red-950/50 rounded">
                                                    {pendingCandidates.length} Thí sinh chờ duyệt
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Ngày thi: {formatVNTime(exam.examDate)} • Sân: {exam.dojo === "TACHI" ? "Sân Tachi" : exam.dojo === "HAYATE" ? "Aikido Hayate" : "Cả 2 sân"}
                                            </p>
                                        </div>

                                        {/* CÁC NÚT THAO TÁC: Xem/chỉnh sửa trực tiếp, Từ chối, Duyệt */}
                                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                            <ExamGradingModal exam={exam} isSuperAdmin={true} />

                                            <button
                                                type="button"
                                                disabled={isPending}
                                                onClick={() => setRejectModal({ id: exam.id, type: "EXAM" })}
                                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                                            >
                                                Từ chối
                                            </button>

                                            <button
                                                type="button"
                                                disabled={isPending}
                                                onClick={() => handleApproveExamScores(exam)}
                                                className="px-4 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg font-bold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Duyệt & Phong đai</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                                                <tr>
                                                    <th className="p-2.5">Mã số</th>
                                                    <th className="p-2.5">Họ và tên</th>
                                                    <th className="p-2.5">Cấp hiện tại</th>
                                                    <th className="p-2.5 text-red-600">Lên đai đề xuất</th>
                                                    <th className="p-2.5 text-center">Điểm HLV chấm</th>
                                                    <th className="p-2.5 text-right">Danh hiệu / Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {pendingCandidates.map((c) => {
                                                    const candidateData = c as unknown as {
                                                        finalScore?: number;
                                                        promotedRank?: string;
                                                        titleHonor?: string;
                                                        notes?: string;
                                                    };
                                                    return (
                                                        <tr key={c.id}>
                                                            <td className="p-2.5 font-mono text-slate-500">{c.student.studentCode}</td>
                                                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{c.student.fullName}</td>
                                                            <td className="p-2.5 text-slate-500">{c.student.currentRank}</td>
                                                            <td className="p-2.5 font-bold text-red-600 dark:text-red-400">{candidateData.promotedRank || c.targetRank}</td>
                                                            <td className="p-2.5 text-center font-black text-slate-900 dark:text-white">{candidateData.finalScore ?? "—"}</td>
                                                            <td className="p-2.5 text-right font-medium text-slate-500">
                                                                {candidateData.titleHonor ? <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold mr-1">{candidateData.titleHonor}</span> : null}
                                                                <span>{candidateData.notes || "—"}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 1: ẢNH THẺ */}
            {tab === "AVATARS" && (
                <div className="space-y-4">
                    {pendingAvatars.length === 0 ? (
                        <p className="text-sm text-slate-500 py-8 text-center">Không có ảnh thẻ nào đang chờ duyệt.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {pendingAvatars.map((st) => (
                                <div key={st.id} className="p-4 border rounded-xl bg-white dark:bg-slate-900 flex flex-col items-center space-y-3 shadow-xs">
                                    <div className="relative w-28 h-36 rounded-lg overflow-hidden bg-slate-100 border">
                                        {st.pendingAvatar && <Image src={st.pendingAvatar} alt={st.fullName} fill className="object-cover" />}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">{st.fullName}</p>
                                        <p className="text-xs font-mono text-red-600 font-bold">{st.studentCode}</p>
                                        {st.updatedAt && (
                                            <span className="text-[11px] text-slate-400 flex items-center justify-center space-x-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatVNTime(st.updatedAt)}</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2 w-full pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            disabled={isPending}
                                            onClick={() => setRejectModal({ id: st.id, type: "AVATAR" })}
                                            className="flex-1 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            disabled={isPending}
                                            onClick={() => {
                                                startTransition(() => {
                                                    void handleAvatarApproval(st.id, "APPROVE");
                                                });
                                            }}
                                            className="flex-1 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors cursor-pointer"
                                        >
                                            Duyệt
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: MÔN SINH MỚI */}
            {tab === "CREATIONS" && (
                <div className="space-y-4">
                    {pendingCreations.length === 0 ? (
                        <p className="text-sm text-slate-500 py-8 text-center">Không có môn sinh mới nào đang chờ duyệt.</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingCreations.map((st) => {
                                const currentTitle = selectedTitles[st.id] ?? (st.title || "MEMBER");
                                const isShidoin = currentTitle === "SHIDOIN";

                                return (
                                    <div key={st.id} className="p-5 border rounded-xl bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-bold text-base text-slate-900 dark:text-white">{st.fullName}</span>
                                                    <span className="font-mono text-xs font-bold text-red-600 px-2 py-0.5 bg-red-50 dark:bg-red-950/50 rounded">
                                                        {st.studentCode}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {st.dojo} • {st.currentRank} • SĐT: {st.phone || "—"} {st.email ? `• Email: ${st.email}` : ""}
                                                </p>
                                            </div>

                                            <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                                                <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                                    <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                    <span>Người tạo: <strong>{st.creatorName || "HLV"}</strong> ({st.creatorCode || "—"})</span>
                                                </div>
                                                <div className="flex items-center space-x-1.5 text-slate-400">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Gửi lúc: {formatVNTime(st.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                                Chức vụ võ đường:
                                            </label>
                                            <select
                                                value={currentTitle}
                                                onChange={(e) => handleTitleChange(st.id, e.target.value)}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                                            >
                                                <option value="MEMBER">Môn sinh (MEMBER)</option>
                                                <option value="FUKU_SHIDOSHA">Lớp phó (FUKU_SHIDOSHA)</option>
                                                <option value="SHIDOSHA">Lớp trưởng (SHIDOSHA)</option>
                                                <option value="SHIDOIN">Huấn luyện viên (SHIDOIN)</option>
                                            </select>
                                        </div>

                                        {isShidoin && (
                                            <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2 animate-in fade-in duration-150">
                                                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                                                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <span>Bảng phân quyền Huấn Luyện Viên đã chọn:</span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                                                    {Object.entries(PERMISSION_LABELS).map(([k, label]) => {
                                                        const curVal = activePermissions[st.id]?.[k] ?? (st.coachPermission?.[k] || "VIEW");
                                                        return (
                                                            <div key={k} className="text-xs">
                                                                <span className="block text-slate-600 dark:text-slate-400 text-[11px] font-medium truncate">{label}</span>
                                                                <select
                                                                    value={curVal === "NONE" ? "VIEW" : curVal}
                                                                    onChange={(e) => handlePermChange(st.id, k, e.target.value, st.coachPermission)}
                                                                    className={`w-full mt-1 px-2 py-1 text-xs font-bold rounded border ${curVal === "EDIT"
                                                                        ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800"
                                                                        : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                                                                        }`}
                                                                >
                                                                    <option value="VIEW">Xem</option>
                                                                    <option value="EDIT">Sửa</option>
                                                                </select>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end space-x-2 pt-2">
                                            <button
                                                disabled={isPending}
                                                onClick={() => setRejectModal({ id: st.id, type: "CREATION" })}
                                                className="px-4 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
                                            >
                                                Từ chối
                                            </button>
                                            <button
                                                disabled={isPending}
                                                onClick={() => {
                                                    startTransition(() => {
                                                        void handleCreationApproval(
                                                            st.id,
                                                            "APPROVE",
                                                            undefined,
                                                            isShidoin ? activePermissions[st.id] ?? st.coachPermission ?? undefined : undefined
                                                        );
                                                    });
                                                }}
                                                className="px-4 py-2 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Duyệt môn sinh</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: SỬA HỒ SƠ */}
            {tab === "EDITS" && (
                <div className="space-y-4">
                    {pendingEdits.length === 0 ? (
                        <p className="text-sm text-slate-500 py-8 text-center">Không có yêu cầu chỉnh sửa nào chờ duyệt.</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingEdits.map((item) => {
                                const parsed = JSON.parse(item.changedData) as Record<string, unknown>;
                                const currentTitle = selectedTitles[item.id] ?? (parsed.title || item.student.title || "MEMBER");
                                const isShidoin = currentTitle === "SHIDOIN";
                                const coachSavedPerms = (parsed.permissions as Record<string, string>) || item.student.coachPermission;

                                return (
                                    <div key={item.id} className="p-5 border rounded-xl bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <div>
                                                <span className="font-bold text-base text-slate-900 dark:text-white">
                                                    {item.student.fullName} ({item.student.studentCode})
                                                </span>
                                                <p className="text-xs text-slate-500 mt-0.5">Yêu cầu thay đổi thông tin môn sinh</p>
                                            </div>

                                            <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                                                <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                                    <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                    <span>
                                                        {item.coachCode ? "HLV gửi:" : "Môn sinh gửi:"} <strong>{item.coachName}</strong> ({item.coachCode || "STUDENT_SELF"})
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-1.5 text-slate-400">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Gửi lúc: {formatVNTime(item.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                                            <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 p-2.5 border-b border-slate-200 dark:border-slate-800">
                                                <div className="col-span-3">Trường thông tin</div>
                                                <div className="col-span-4">Hồ sơ gốc</div>
                                                <div className="col-span-5 flex items-center space-x-1 text-red-600 dark:text-red-400">
                                                    <span>Đề xuất sau chỉnh sửa</span>
                                                </div>
                                            </div>

                                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                {ALL_STUDENT_KEYS.map((key) => {
                                                    const label = FIELD_LABELS[key] || key;
                                                    const origRaw = (item.student as Record<string, unknown>)[key];
                                                    const origDisplay = formatVNValue(key, origRaw);

                                                    const hasNewVal = Object.prototype.hasOwnProperty.call(parsed, key);
                                                    const newVal = hasNewVal ? parsed[key] : origRaw;
                                                    const newDisplay = formatVNValue(key, newVal);

                                                    const isChanged = hasNewVal && origDisplay !== newDisplay;

                                                    return (
                                                        <div
                                                            key={key}
                                                            className={`grid grid-cols-12 p-2.5 items-center transition-colors ${isChanged
                                                                ? "bg-amber-50/40 dark:bg-amber-950/20 font-semibold"
                                                                : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                                                }`}
                                                        >
                                                            <div className="col-span-3 text-slate-600 dark:text-slate-400 font-medium">
                                                                {label}
                                                            </div>
                                                            <div className="col-span-4 text-slate-500 dark:text-slate-400 font-mono">
                                                                {origDisplay}
                                                            </div>
                                                            <div className="col-span-5 flex flex-col font-mono">
                                                                <div className="flex items-center space-x-2">
                                                                    {isChanged ? (
                                                                        <>
                                                                            <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                                                                            <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                                                                {newDisplay}
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-slate-700 dark:text-slate-300">{newDisplay}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end space-x-2 pt-2">
                                            <button
                                                disabled={isPending}
                                                onClick={() => setRejectModal({ id: item.id, type: "EDIT" })}
                                                className="px-4 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
                                            >
                                                Từ chối
                                            </button>
                                            <button
                                                disabled={isPending}
                                                onClick={() => {
                                                    startTransition(() => {
                                                        void (async () => {
                                                            const res = await handleEditApproval(
                                                                item.id,
                                                                "APPROVE",
                                                                undefined,
                                                                isShidoin ? activePermissions[item.id] ?? (coachSavedPerms as Record<string, string>) ?? undefined : undefined
                                                            );

                                                            if (res && res.success) {
                                                                setActionResultModal({
                                                                    type: "SUCCESS",
                                                                    title: "Phê duyệt thành công!",
                                                                    message: "Đã kiểm tra toàn bộ trường dữ liệu trên Database. Mọi thông tin đã được đồng bộ chính xác.",
                                                                });
                                                                setTimeout(() => setActionResultModal(null), 2000);
                                                            } else {
                                                                setActionResultModal({
                                                                    type: "ERROR",
                                                                    title: "Lỗi đồng bộ Database!",
                                                                    message: res?.errors?.join("\n") || "Không thể lưu dữ liệu vào cơ sở dữ liệu.",
                                                                });
                                                            }
                                                        })();
                                                    });
                                                }}
                                                className="px-4 py-2 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Duyệt sửa đổi</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* FORM CHUNG TỪ CHỐI TÁI SỬ DỤNG */}
            <CommonRejectModal
                isOpen={Boolean(rejectModal)}
                title={
                    rejectModal?.type === "EXAM"
                        ? "Từ chối bảng điểm kỳ thi"
                        : rejectModal?.type === "AVATAR"
                            ? "Từ chối ảnh thẻ"
                            : rejectModal?.type === "CREATION"
                                ? "Từ chối duyệt môn sinh mới"
                                : "Từ chối yêu cầu sửa đổi hồ sơ"
                }
                placeholder="Nhập lý do cụ thể (Ví dụ: Thang điểm chưa đạt chuẩn, sai thông tin môn sinh...)"
                reason={rejectReason}
                isPending={isPending}
                onChangeReason={setRejectReason}
                onConfirm={confirmReject}
                onClose={() => {
                    setRejectModal(null);
                    setRejectReason("");
                }}
            />

            {/* Modal Thông báo kết quả kiểm tra Database */}
            {actionResultModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className={`bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border ${actionResultModal.type === "SUCCESS" ? "border-emerald-500" : "border-red-500"} animate-in fade-in zoom-in-95 duration-150`}>
                        <div className="space-y-1">
                            <h3 className={`text-base font-black uppercase tracking-tight ${actionResultModal.type === "SUCCESS" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                {actionResultModal.title}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                {actionResultModal.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
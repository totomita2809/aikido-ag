"use client";

import { useState, useTransition } from "react";
import { Award, FileText, Plus, X, Users, AlertCircle, Loader2 } from "lucide-react";
import { generateExamDocx } from "@/lib/docxExport";
import { createExamSession } from "@/app/actions/exam";
import { AIKIDO_RANKS, DOJO_CONTACT_INFO } from "@/lib/constants";

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
    coaches: CoachItem[];
    candidates: CandidateItem[];
}

// Lấy danh sách cấp đai từ "Đai nâu 1 vạch" trở lên từ AIKIDO_RANKS chung
const AVAILABLE_BELTS = AIKIDO_RANKS.slice(4);

export default function CreateExamModal({ coaches, candidates }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // 1. Thông tin kỳ thi cơ bản
    const [title, setTitle] = useState("Kỳ thi thăng cấp đai Q3/2026");
    const [examDate, setExamDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [examTime, setExamTime] = useState("08:00");
    const [dojo] = useState("ALL");

    // 2. Tùy chọn HLV Trưởng tham gia
    const [headCoachPresent, setHeadCoachPresent] = useState(true);

    // 3. Ban chấm thi
    const [selectedExaminers, setSelectedExaminers] = useState<Record<string, { role: string; rank: string; fullName: string }>>({});

    // State quản lý việc thêm môn sinh tự do vào ban chấm thi (lọc từ đai Nâu 1 trở lên)
    const [showAddExaminerModal, setShowAddExaminerModal] = useState(false);
    const [examinerSearchKeyword, setExaminerSearchKeyword] = useState("");

    // 4. Chọn môn sinh tham gia thi (Lọc bỏ các môn sinh đang ở cấp đai "Đai nâu 3 vạch" nếu họ đã đạt mức tối đa xét đai thường)
    const filteredCandidates = candidates.filter((c) => c.currentRank !== "Đai nâu 3 vạch");

    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [customRanks, setCustomRanks] = useState<Record<string, string>>({});
    const [globalSpecialReason, setGlobalSpecialReason] = useState("");

    const toggleExaminer = (coachId: string, fullName: string, currentRank: string) => {
        setSelectedExaminers((prev) => {
            const next = { ...prev };
            if (next[coachId]) {
                delete next[coachId];
            } else {
                next[coachId] = {
                    fullName,
                    rank: currentRank,
                    role: "Chấm phụ",
                };
            }
            return next;
        });
    };

    const updateExaminerRole = (coachId: string, role: string) => {
        setSelectedExaminers((prev) => {
            const current = prev[coachId];
            if (!current) return prev;
            return {
                ...prev,
                [coachId]: { ...current, role },
            };
        });
    };

    const toggleCandidate = (id: string) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const updateCustomRank = (id: string, rank: string) => {
        setCustomRanks((prev) => ({ ...prev, [id]: rank }));
    };

    // Phân loại thí sinh đã chọn
    const selectedStudents = filteredCandidates.filter((c) => selectedStudentIds.includes(c.id));
    const eligibleStudents = selectedStudents.filter((c) => c.isEligible);
    const specialStudents = selectedStudents.filter((c) => !c.isEligible);

    // Lọc danh sách HLV/môn sinh có cấp đai từ "Đai nâu 1 vạch" trở lên để thêm vào ban chấm thi
    const brownAndBlackBeltIndex = AIKIDO_RANKS.indexOf("Đai nâu 1 vạch" as (typeof AIKIDO_RANKS)[number]);
    const eligibleExaminerCandidates = candidates.filter((st) => {
        const rankIdx = AIKIDO_RANKS.indexOf(st.currentRank as (typeof AIKIDO_RANKS)[number]);
        // Bao gồm cả các HLV truyền vào hoặc môn sinh có đai từ nâu 1 trở lên
        const isQualifiedRank = rankIdx !== -1 && rankIdx >= brownAndBlackBeltIndex;
        const matchesKeyword = st.fullName.toLowerCase().includes(examinerSearchKeyword.toLowerCase()) || st.studentCode.toLowerCase().includes(examinerSearchKeyword.toLowerCase());
        return isQualifiedRank && matchesKeyword;
    });

    // Xuất file Word & Lưu Database
    const handleExportAndSave = () => {
        if (selectedStudents.length === 0) {
            alert("Vui lòng chọn ít nhất 1 môn sinh tham dự kỳ thi!");
            return;
        }

        // Chuẩn bị danh sách Ban Chấm Thi
        const examinerList: Array<{ order: number; fullName: string; rank: string; role: string }> = [];
        if (headCoachPresent) {
            examinerList.push({
                order: 0,
                fullName: DOJO_CONTACT_INFO.headCoach,
                rank: DOJO_CONTACT_INFO.coachRank,
                role: "Chấm chính",
            });
        }

        Object.values(selectedExaminers).forEach((ex, idx) => {
            examinerList.push({
                order: idx + 1,
                fullName: ex.fullName,
                rank: ex.rank,
                role: ex.role,
            });
        });

        // Chuẩn bị danh sách Môn Sinh
        const candidateDocxList = selectedStudents.map((s, idx) => {
            let dobFormatted = "—";
            if (s.dateOfBirth) {
                const d = new Date(s.dateOfBirth);
                if (!isNaN(d.getTime())) {
                    const day = String(d.getDate()).padStart(2, "0");
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    dobFormatted = `${day}/${m}/${d.getFullYear()}`;
                }
            }

            const targetRank = customRanks[s.id] || s.suggestedNextRank || "Đai xanh 1 vạch";

            return {
                order: idx + 1,
                fullName: s.fullName,
                dob: dobFormatted,
                targetRank,
            };
        });

        // Định dạng chuỗi ngày tháng năm in trên tiêu đề
        const [y, m, d] = examDate.split("-");
        const dateStr = `Ngày ${d} tháng ${m} năm ${y}`;

        startTransition(async () => {
            try {
                // 1. Lưu vào Database
                await createExamSession({
                    title,
                    examDate: `${examDate}T${examTime}:00`,
                    dojo,
                    headCoachPresent,
                    examiners: examinerList,
                    candidates: selectedStudents.map((s) => ({
                        studentId: s.id,
                        targetRank: customRanks[s.id] || s.suggestedNextRank,
                        isSpecial: !s.isEligible,
                        specialReason: !s.isEligible ? globalSpecialReason : undefined,
                    })),
                });

                // 2. Xuất file Word (.docx)
                await generateExamDocx(dateStr, examinerList, candidateDocxList);

                setIsOpen(false);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo kỳ thi hoặc xuất Word!";
                alert(message);
            }
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
                <Plus className="w-4 h-4" />
                <span>Tạo kỳ thi thăng đai</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <Award className="w-6 h-6" />
                                <h2 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                                    Tổ Chức Kỳ Thi Thăng Cấp Đai
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 1. Câu hỏi HLV Trưởng trên cùng */}
                        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <span className="font-bold text-sm text-amber-900 dark:text-amber-200 block">
                                    HLV Trưởng có tham gia chấm kỳ thi này không?
                                </span>
                                <span className="text-xs text-amber-700 dark:text-amber-400">
                                    Nếu chọn Có, Thầy {DOJO_CONTACT_INFO.headCoach} sẽ đứng đầu Ban chấm thi với vai trò Chấm chính.
                                </span>
                            </div>
                            <div className="flex items-center space-x-4 shrink-0">
                                <label className="inline-flex items-center space-x-1.5 cursor-pointer text-sm font-semibold">
                                    <input
                                        type="radio"
                                        name="headCoach"
                                        checked={headCoachPresent}
                                        onChange={() => setHeadCoachPresent(true)}
                                        className="text-red-600 focus:ring-red-500"
                                    />
                                    <span>Có</span>
                                </label>
                                <label className="inline-flex items-center space-x-1.5 cursor-pointer text-sm font-semibold">
                                    <input
                                        type="radio"
                                        name="headCoach"
                                        checked={!headCoachPresent}
                                        onChange={() => setHeadCoachPresent(false)}
                                        className="text-red-600 focus:ring-red-500"
                                    />
                                    <span>Không</span>
                                </label>
                            </div>
                        </div>

                        {/* 2. Thông tin cơ bản */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div className="sm:col-span-2">
                                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Tên kỳ thi:
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Ngày thi:
                                </label>
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Giờ thi:
                                </label>
                                <input
                                    type="time"
                                    value={examTime}
                                    onChange={(e) => setExamTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* 3. Ban chấm thi & Nút Thêm môn sinh (từ đai Nâu 1 trở lên) */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    <span>Thành phần Ban chấm thi</span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowAddExaminerModal(true)}
                                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Thêm môn sinh (Nâu 1+) vào ban chấm thi</span>
                                </button>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500">
                                        <tr>
                                            <th className="p-2.5 w-12 text-center">Trạng thái</th>
                                            <th className="p-2.5">Họ và tên</th>
                                            <th className="p-2.5">Cấp đai</th>
                                            <th className="p-2.5">VAI TRÒ CHẤM THI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {headCoachPresent && (
                                            <tr className="bg-amber-50/40 dark:bg-amber-950/20 font-semibold">
                                                <td className="p-2.5 text-center text-amber-600">★</td>
                                                <td className="p-2.5 text-slate-900 dark:text-white">
                                                    {DOJO_CONTACT_INFO.headCoach} (HLV Trưởng)
                                                </td>
                                                <td className="p-2.5 text-amber-700 dark:text-amber-400">
                                                    {DOJO_CONTACT_INFO.coachRank}
                                                </td>
                                                <td className="p-2.5 font-bold text-red-600">Chấm chính</td>
                                            </tr>
                                        )}
                                        {coaches.map((c) => {
                                            const isSelected = Boolean(selectedExaminers[c.id]);
                                            return (
                                                <tr key={c.id}>
                                                    <td className="p-2.5 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleExaminer(c.id, c.fullName, c.currentRank)}
                                                            className="rounded text-red-600 focus:ring-red-500"
                                                        />
                                                    </td>
                                                    <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                                                        {c.fullName}
                                                    </td>
                                                    <td className="p-2.5 text-slate-500">{c.currentRank}</td>
                                                    <td className="p-2.5">
                                                        {isSelected && selectedExaminers[c.id] ? (
                                                            <select
                                                                value={selectedExaminers[c.id].role}
                                                                onChange={(e) => updateExaminerRole(c.id, e.target.value)}
                                                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 text-xs font-semibold outline-none cursor-pointer"
                                                            >
                                                                <option value="Chấm chính" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Chấm chính</option>
                                                                <option value="Chấm phụ" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Chấm phụ</option>
                                                                <option value="Giám sát" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Giám sát</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Hiển thị các HLV/môn sinh bổ sung ngoài danh sách HLV mặc định */}
                                        {Object.entries(selectedExaminers).map(([id, ex]) => {
                                            if (!coaches.some((c) => c.id === id)) {
                                                return (
                                                    <tr key={id} className="bg-blue-50/30 dark:bg-blue-950/20">
                                                        <td className="p-2.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={true}
                                                                onChange={() => toggleExaminer(id, ex.fullName, ex.rank)}
                                                                className="rounded text-red-600 focus:ring-red-500"
                                                            />
                                                        </td>
                                                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                                                            {ex.fullName} <span className="text-[10px] text-blue-600 bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded ml-1">Bổ sung</span>
                                                        </td>
                                                        <td className="p-2.5 text-slate-500">{ex.rank}</td>
                                                        <td className="p-2.5">
                                                            <select
                                                                value={ex.role}
                                                                onChange={(e) => updateExaminerRole(id, e.target.value)}
                                                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 text-xs font-semibold outline-none cursor-pointer"
                                                            >
                                                                <option value="Chấm chính" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Chấm chính</option>
                                                                <option value="Chấm phụ" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Chấm phụ</option>
                                                                <option value="Giám sát" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Giám sát</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return null;
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 4. Tuyển chọn môn sinh thi (Đã lọc bỏ Đai nâu 3 vạch) */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Award className="w-4 h-4 text-emerald-500" />
                                    <span>Danh sách môn sinh tham dự ({selectedStudentIds.length})</span>
                                </h3>
                                <span className="text-xs text-slate-500">
                                    {eligibleStudents.length} đủ điều kiện • {specialStudents.length} đặc cách
                                </span>
                            </div>

                            {/* Bảng chọn môn sinh */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto text-xs">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500 sticky top-0">
                                        <tr>
                                            <th className="p-2.5 w-10 text-center">Chọn</th>
                                            <th className="p-2.5">Mã số</th>
                                            <th className="p-2.5">Họ và tên</th>
                                            <th className="p-2.5">Sân</th>
                                            <th className="p-2.5">Cấp hiện tại</th>
                                            <th className="p-2.5">Tình trạng</th>
                                            <th className="p-2.5">Dự kiến lên</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredCandidates.map((st) => {
                                            const isChecked = selectedStudentIds.includes(st.id);
                                            return (
                                                <tr key={st.id} className={isChecked ? "bg-red-50/30 dark:bg-red-950/20" : ""}>
                                                    <td className="p-2.5 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleCandidate(st.id)}
                                                            className="rounded text-red-600 focus:ring-red-500"
                                                        />
                                                    </td>
                                                    <td className="p-2.5 font-mono text-slate-500">{st.studentCode}</td>
                                                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">{st.fullName}</td>
                                                    <td className="p-2.5">{st.dojo === "TACHI" ? "Tachi" : "Hayate"}</td>
                                                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{st.currentRank}</td>
                                                    <td className="p-2.5">
                                                        {st.isEligible ? (
                                                            <span className="text-emerald-600 font-bold">Đủ chuẩn</span>
                                                        ) : (
                                                            <span className="text-amber-600 font-semibold">Chưa đủ</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5">
                                                        <select
                                                            value={customRanks[st.id] || st.suggestedNextRank}
                                                            onChange={(e) => updateCustomRank(st.id, e.target.value)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 text-xs font-semibold outline-none cursor-pointer"
                                                        >
                                                            {AVAILABLE_BELTS.map((b) => (
                                                                <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                                                    {b}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Ô nhập lý do đặc cách chung (nếu có chọn bạn chưa đủ chuẩn) */}
                            {specialStudents.length > 0 && (
                                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
                                    <div className="flex items-center space-x-1.5 font-bold text-amber-900 dark:text-amber-200">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        <span>Lý do đặc cách của HLV Trưởng cho {specialStudents.length} môn sinh:</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={globalSpecialReason}
                                        onChange={(e) => setGlobalSpecialReason(e.target.value)}
                                        placeholder="VD: Kỹ thuật tốt, tư chất vững, hoàn thành bài kiểm tra sớm..."
                                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer nút hành động */}
                        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleExportAndSave}
                                className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FileText className="w-4 h-4" />
                                )}
                                <span>{isPending ? "Đang xử lý..." : "Lưu & Xuất phiếu chấm thi Word"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal phụ chọn môn sinh từ đai Nâu 1 trở lên vào hội đồng chấm thi */}
            {showAddExaminerModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                Chọn môn sinh (Cấp đai Đai nâu 1 vạch trở lên) làm giám khảo phụ
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddExaminerModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc mã môn sinh..."
                                value={examinerSearchKeyword}
                                onChange={(e) => setExaminerSearchKeyword(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            {eligibleExaminerCandidates.length === 0 ? (
                                <div className="p-4 text-center text-slate-400">Không tìm thấy môn sinh phù hợp (cần đai Nâu 1 trở lên).</div>
                            ) : (
                                eligibleExaminerCandidates.map((st) => {
                                    const isAdded = Boolean(selectedExaminers[st.id]);
                                    return (
                                        <div key={st.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{st.fullName} <span className="font-mono text-slate-400 font-normal">({st.studentCode})</span></div>
                                                <div className="text-amber-700 dark:text-amber-400 font-medium">{st.currentRank}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggleExaminer(st.id, st.fullName, st.currentRank)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${isAdded ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                            >
                                                {isAdded ? "Đã thêm (Bỏ)" : "Thêm vào ban chấm"}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddExaminerModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                            >
                                Hoàn tất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
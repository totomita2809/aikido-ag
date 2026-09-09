"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Calendar, Phone, Award, Clock, Users, Check, Save, UserPlus2 } from "lucide-react";
import { saveBatchAttendance } from "@/app/actions/attendance";

interface StudentItem {
    id: string;
    studentCode: string;
    fullName: string;
    currentRank: string;
    phone: string | null;
    joinDate: Date;
    parentPhone?: string | null;
    avatarUrl?: string | null;
    isPresentInitial: boolean;
    dojo: string;
}

interface Props {
    primaryStudents: StudentItem[];
    guestStudents: StudentItem[];
    selectedDate: string;
    primaryDojoName: string;
    guestDojoName: string;
}

export default function AttendanceSheet({
    primaryStudents,
    guestStudents,
    selectedDate,
    primaryDojoName,
    guestDojoName,
}: Props) {
    const allStudents = [...primaryStudents, ...guestStudents];

    // Danh sách ID các môn sinh đang được tick
    const [selectedIds, setSelectedIds] = useState<string[]>(() =>
        allStudents.filter((s) => s.isPresentInitial).map((s) => s.id)
    );
    const [isPending, startTransition] = useTransition();
    const [saveSuccess, setSaveSuccess] = useState(false);

    const toggleStudent = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
        setSaveSuccess(false);
    };

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("date", selectedDate);
        selectedIds.forEach((id) => formData.append("presentIds", id));

        startTransition(async () => {
            await saveBatchAttendance(formData);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        });
    };

    const renderStudentCard = (student: StudentItem, isGuest = false) => {
        const isChecked = selectedIds.includes(student.id);

        return (
            // Thay vì để cả label lẫn input cùng bắt sự kiện:
            <label
                key={student.id}
                htmlFor={`student-${student.id}`}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all ${isChecked
                        ? isGuest
                            ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-sm"
                            : "bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
            >
                {/* Khối bên trái: Ảnh + thông tin */}
                <div className="flex items-center space-x-3 min-w-0 pointer-events-none">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {student.avatarUrl ? (
                            <Image src={student.avatarUrl} alt={student.fullName} fill className="object-cover" />
                        ) : (
                            <span className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase">
                                {student.fullName.charAt(0)}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center space-x-2">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                {student.fullName}
                            </h4>
                            <span className="font-mono text-[11px] text-slate-400 shrink-0">
                                {student.studentCode}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center text-red-600 dark:text-red-400 font-medium">
                                <Award className="w-3 h-3 mr-1" />
                                {student.currentRank}
                            </span>

                            <span className="inline-flex items-center">
                                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                {new Date(student.joinDate).toLocaleDateString("vi-VN")}
                            </span>
                        </div>

                        {student.parentPhone && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center pt-0.5">
                                <Phone className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                                <span>PH: <strong className="text-slate-700 dark:text-slate-200 font-mono">{student.parentPhone}</strong></span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Khối bên phải: Checkbox Native kết hợp Icon Custom */}
                <div className="pl-3 shrink-0 flex items-center">
                    <input
                        id={`student-${student.id}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStudent(student.id)}
                        className="sr-only"
                    />
                    <div
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors pointer-events-none ${isChecked
                                ? isGuest
                                    ? "bg-amber-600 border-amber-600 text-white"
                                    : "bg-red-600 border-red-600 text-white"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            }`}
                    >
                        {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                </div>
            </label>
        );
    };

    const guestSelectedCount = guestStudents.filter((s) => selectedIds.includes(s.id)).length;
    const primarySelectedCount = primaryStudents.filter((s) => selectedIds.includes(s.id)).length;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            {/* THANH ĐIỀU KHIỂN NỔI CỐ ĐỊNH TRÊN CÙNG */}
            <div className="sticky top-16 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-between gap-3 transition-all">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-baseline space-x-1.5">
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                {selectedIds.length}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-slate-400">
                                môn sinh trên thảm
                            </span>
                        </div>
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                            {primarySelectedCount} chính thức {guestSelectedCount > 0 && `+ ${guestSelectedCount} tập chéo sân`}
                        </p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className={`inline-flex items-center space-x-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm ${saveSuccess
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-red-600 hover:bg-red-700 active:scale-95"
                        } disabled:opacity-50`}
                >
                    {isPending ? (
                        <Clock className="w-4 h-4 animate-spin" />
                    ) : saveSuccess ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    <span>{isPending ? "Đang lưu..." : saveSuccess ? "Đã lưu thành công" : "Cập nhật điểm danh"}</span>
                </button>
            </div>

            {/* KHU VỰC 1: SÂN CHÍNH */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                        Môn sinh trực thuộc: {primaryDojoName}
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {primarySelectedCount}/{primaryStudents.length} có mặt
                    </span>
                </div>

                {primaryStudents.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-400">
                        Chưa có môn sinh nào thuộc sân này.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {primaryStudents.map((s) => renderStudentCard(s, false))}
                    </div>
                )}
            </div>

            {/* KHU VỰC 2: SÂN PHỤ */}
            <div className="space-y-3 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-2">
                        <div className="p-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded">
                            <UserPlus2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                                Môn sinh {guestDojoName} (Tập chéo sân / Tập bù)
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Tick chọn nếu có bạn sang tập chung buổi này
                            </p>
                        </div>
                    </div>
                    {guestSelectedCount > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            +{guestSelectedCount} bạn
                        </span>
                    )}
                </div>

                {guestStudents.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-400">
                        Không có môn sinh từ cơ sở còn lại.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {guestStudents.map((s) => renderStudentCard(s, true))}
                    </div>
                )}
            </div>
        </form>
    );
}
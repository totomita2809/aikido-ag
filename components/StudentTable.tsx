"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Users, Plus, Calendar, Award, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import ExportButton from "@/components/ExportButton";
import { getTitleLabel } from "@/utils/titleHelper";
import StudentEditForm from "@/components/StudentEditForm";
import StudentAvatarUploader from "@/components/StudentAvatarUploader";
import { directUpdateStudentAction } from "@/app/actions/approval";
import { deleteStudent, ensureMissingUsersAction } from "@/app/actions/student";

interface StudentUserRecord {
    id: string;
    username: string;
}

interface Student {
    id: string;
    studentCode: string;
    fullName: string;
    currentRank: string;
    gender: string | null;
    phone: string | null;
    parentPhone?: string | null;
    email?: string | null;
    address?: string | null;
    dateOfBirth?: Date | null;
    healthNote?: string | null;
    dojo?: string;
    joinDate: Date | null;
    status: string;
    title: string;
    avatar?: string | null;
    pendingAvatar?: string | null;
    avatarStatus?: string | null;
    user?: StudentUserRecord | null;
}

interface StudentTableProps {
    initialStudents: Student[];
    totalStudents: number;
    activeStudents: number;
    blackBeltCount: number;
    currentUserRole?: string;
    currentStudentId?: string | null;
}

export default function StudentTable({
    initialStudents: serverStudents,
    totalStudents,
    activeStudents,
    blackBeltCount,
    currentUserRole,
    currentStudentId,
}: StudentTableProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

    const isStudent = currentUserRole === "STUDENT";
    const canInlineEdit = currentUserRole === "SUPER_ADMIN" || currentUserRole === "COACH";
    const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash) {
            const targetId = window.location.hash.replace("#", "");
            const timer = setTimeout(() => {
                setIsLoading(false);
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, []);

    const filteredStudents = serverStudents.filter((student) => {
        const term = search.toLowerCase().trim();
        return (
            student.fullName.toLowerCase().includes(term) ||
            student.studentCode.toLowerCase().includes(term)
        );
    });

    const getRankBadgeColor = (rank: string) => {
        if (rank.includes("đen")) {
            return "bg-slate-900 text-white border-slate-700 dark:bg-slate-800 dark:border-slate-600";
        }
        if (rank.includes("nâu")) {
            return "bg-amber-900/10 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border-amber-800/30";
        }
        if (rank.includes("xanh dương")) {
            return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";
        }
        if (rank.includes("xanh lá")) {
            return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
        }
        if (rank.includes("cam")) {
            return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800";
        }
        if (rank.includes("vàng")) {
            return "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
        }
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    };

    const toggleExpand = (studentId: string) => {
        if (!canInlineEdit) return;
        setExpandedStudentId((prev) => (prev === studentId ? null : studentId));
    };

    return (
        <>
            {isLoading && (
                <SplashScreen
                    finishLoading={() => setIsLoading(false)}
                    logoName="aikido ag"
                    title="Aikido An Giang"
                    subtitle="HỆ THỐNG QUẢN LÝ MÔN SINH"
                />
            )}

            <div
                className={`space-y-6 transition-opacity duration-500 ${isLoading ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                            Quản lý Môn sinh
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Hiệp Khí Đạo An Giang - Theo dõi hồ sơ, cấp đai và quá trình thăng cấp
                        </p>
                    </div>
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
                        {isSuperAdmin && <SyncMissingUsersButton students={serverStudents} />}
                        <ExportButton type="STUDENTS" />
                        {!isStudent && (
                            <Link
                                href="/students/new"
                                className="inline-flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Thêm môn sinh mới</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Thống kê dữ liệu thật */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                                Tổng môn sinh
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {totalStudents}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                                Đang tập luyện
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {activeStudents}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                                Huyền đai (Đai đen)
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {blackBeltCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Khung tìm kiếm và bảng danh sách */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên hoặc mã môn sinh..."
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                {search ? "Không tìm thấy môn sinh phù hợp" : "Chưa có môn sinh nào"}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                {search
                                    ? "Hãy thử tìm kiếm bằng từ khóa hoặc mã khác."
                                    : "Nhấn nút thêm bên trên để tạo hồ sơ môn sinh đầu tiên."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-5 py-3.5">Mã số</th>
                                        <th className="px-5 py-3.5">Họ và tên</th>
                                        <th className="px-5 py-3.5">Cấp đai</th>
                                        {!isStudent && <th className="px-5 py-3.5">Số điện thoại</th>}
                                        <th className="px-5 py-3.5">Ngày nhập môn</th>
                                        <th className="px-5 py-3.5 text-right">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredStudents.map((student) => {
                                        const isSelf = currentStudentId === student.id;
                                        const isExpanded = expandedStudentId === student.id;

                                        return (
                                            <React.Fragment key={student.id}>
                                                <tr
                                                    id={`student-${student.id}`}
                                                    className={`transition-all scroll-mt-24 target:bg-amber-100/80 dark:target:bg-amber-950/60 target:ring-2 target:ring-amber-500 ${isSelf
                                                        ? "bg-red-50/60 dark:bg-red-950/30 font-semibold"
                                                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                                        }`}
                                                >
                                                    <td className="px-5 py-4 font-mono font-semibold">
                                                        {isStudent ? (
                                                            isSelf ? (
                                                                <Link
                                                                    href="/students/me"
                                                                    className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                                                                >
                                                                    {student.studentCode}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-slate-700 dark:text-slate-300">
                                                                    {student.studentCode}
                                                                </span>
                                                            )
                                                        ) : canInlineEdit ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpand(student.id)}
                                                                className="text-left text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
                                                            >
                                                                <span>{student.studentCode}</span>
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-3 h-3 text-red-500" />
                                                                ) : (
                                                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                href={`/students/${student.id}`}
                                                                className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                                                            >
                                                                {student.studentCode}
                                                            </Link>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-9 h-9 rounded-full overflow-hidden relative border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                                                                {student.avatar ? (
                                                                    <Image
                                                                        src={student.avatar}
                                                                        alt={student.fullName}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="font-bold text-xs text-slate-500">
                                                                        {student.fullName.charAt(0)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {canInlineEdit && !isStudent ? (
                                                                <div
                                                                    onClick={() => toggleExpand(student.id)}
                                                                    className="cursor-pointer group flex items-center gap-1.5"
                                                                >
                                                                    <div>
                                                                        <span className="font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors block">
                                                                            {student.fullName}
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block mt-0.5">
                                                                            {getTitleLabel(student.title)} • Bấm sửa nhanh
                                                                        </span>
                                                                    </div>
                                                                    {isExpanded ? (
                                                                        <ChevronUp className="w-3.5 h-3.5 text-red-500" />
                                                                    ) : (
                                                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                                                                    )}
                                                                </div>
                                                            ) : isStudent ? (
                                                                isSelf ? (
                                                                    <Link href="/students/me" className="group block">
                                                                        <span className="font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 hover:underline transition-colors block">
                                                                            {student.fullName}
                                                                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-600 text-white font-black uppercase">
                                                                                Bạn
                                                                            </span>
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block mt-0.5">
                                                                            {getTitleLabel(student.title)}
                                                                        </span>
                                                                    </Link>
                                                                ) : (
                                                                    <div className="block">
                                                                        <span className="font-semibold text-slate-900 dark:text-white block">
                                                                            {student.fullName}
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block mt-0.5">
                                                                            {getTitleLabel(student.title)}
                                                                        </span>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <Link href={`/students/${student.id}`} className="group block">
                                                                    <span className="font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 hover:underline transition-colors block">
                                                                        {student.fullName}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block mt-0.5">
                                                                        {getTitleLabel(student.title)}
                                                                    </span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankBadgeColor(
                                                                student.currentRank
                                                            )}`}
                                                        >
                                                            {student.currentRank}
                                                        </span>
                                                    </td>

                                                    {!isStudent && (
                                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono">
                                                            {student.phone || "—"}
                                                        </td>
                                                    )}

                                                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                                        <div className="flex items-center space-x-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>
                                                                {student.joinDate ? new Date(student.joinDate).toLocaleDateString("vi-VN") : "—"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400">
                                                            {student.status === "ACTIVE" ? "Đang tập" : student.status}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Inline Expand Edit with Sticky Header, Avatar Uploader, Form & Custom Modal Delete Button */}
                                                {isExpanded && canInlineEdit && !isStudent && (
                                                    <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-y border-red-200/50 dark:border-red-900/30">
                                                        <td colSpan={isStudent ? 5 : 6} className="p-0">
                                                            <div className="bg-white dark:bg-slate-900 shadow-sm relative overflow-visible">
                                                                {/* STICKY HEADER CHO KHUNG SỬA NHANH */}
                                                                <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                                                                    <div className="flex items-center gap-3">
                                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                                                                            Đang sửa nhanh: {student.fullName} ({student.studentCode})
                                                                        </h4>
                                                                    </div>
                                                                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                                                                        <StudentAvatarUploader
                                                                            studentId={student.id}
                                                                            currentAvatar={student.avatar || null}
                                                                            pendingAvatar={student.pendingAvatar || null}
                                                                            avatarStatus={student.avatarStatus || "NONE"}
                                                                            isSuperAdmin={isSuperAdmin}
                                                                            onSuperAdminDirectUpdate={async (targetId, dataUrl) => {
                                                                                await directUpdateStudentAction(targetId, {
                                                                                    avatar: dataUrl,
                                                                                    avatarStatus: "APPROVED",
                                                                                    pendingAvatar: null,
                                                                                });
                                                                            }}
                                                                        />
                                                                        {isSuperAdmin && (
                                                                            <CustomDeleteModalButton
                                                                                studentId={student.id}
                                                                                fullName={student.fullName}
                                                                            />
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedStudentId(null)}
                                                                            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
                                                                        >
                                                                            ✕ Thu gọn
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="p-6">
                                                                    <StudentEditForm
                                                                        student={{
                                                                            id: student.id,
                                                                            studentCode: student.studentCode,
                                                                            fullName: student.fullName,
                                                                            currentRank: student.currentRank,
                                                                            dojo: student.dojo || "HAYATE",
                                                                            email: student.email,
                                                                            healthNote: student.healthNote,
                                                                            dateOfBirth: student.dateOfBirth,
                                                                            gender: student.gender,
                                                                            phone: student.phone,
                                                                            parentPhone: student.parentPhone,
                                                                            address: student.address,
                                                                            status: student.status,
                                                                            title: student.title || "MEMBER",
                                                                            joinDate: student.joinDate,
                                                                            user: student.user,
                                                                        }}
                                                                        currentUserRole={currentUserRole}
                                                                        onClose={() => setExpandedStudentId(null)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// Subcomponent for batch missing users sync
function SyncMissingUsersButton({ students }: { students: Student[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<string | null>(null);

    const missingCount = students.filter((s) => !s.user).length;

    if (missingCount <= 0) return null;

    const handleSync = () => {
        startTransition(async () => {
            try {
                const res = await ensureMissingUsersAction();
                if (res && typeof res === "object" && "createdCount" in res) {
                    setMsg(`Đã cấp bù thành công ${Number(res.createdCount)} tài khoản thiếu!`);
                } else {
                    setMsg("Đã cấp bù tài khoản thiếu!");
                }
                router.refresh();
                setTimeout(() => setMsg(null), 3000);
            } catch (err: unknown) {
                alert(err instanceof Error ? err.message : "Lỗi khi cấp user");
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleSync}
                disabled={isPending}
                className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
                <UserCheck className="h-4 w-4" />
                <span>{isPending ? "Đang xử lý..." : `Cấp lại user thiếu (${missingCount})`}</span>
            </button>
            {msg && <span className="text-xs text-emerald-600 font-semibold">{msg}</span>}
        </div>
    );
}

// Internal custom delete modal component matching design system
function CustomDeleteModalButton({ studentId, fullName }: { studentId: string; fullName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        setIsPending(true);
        try {
            await deleteStudent(studentId);
            setIsOpen(false);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Lỗi khi xóa");
            setIsPending(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center space-x-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 transition-colors cursor-pointer"
            >
                <span>Xóa môn sinh</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-6 space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Xác nhận xóa môn sinh
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                Bạn có chắc chắn muốn xóa môn sinh <strong className="text-slate-800 dark:text-slate-200">&ldquo;{fullName}&rdquo;</strong> không? Hành động này sẽ xóa toàn bộ dữ liệu lịch sử đai, điểm danh và tài khoản liên quan.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isPending}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isPending ? "Đang xóa..." : "Xác nhận xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
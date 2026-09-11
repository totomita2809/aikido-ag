import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkPromotionEligibility } from "@/lib/rankRules";
import CreateExamModal from "@/components/CreateExamModal";
import ExamSessionList, { ExamSessionFull } from "@/components/ExamSessionList";

export const dynamic = "force-dynamic";

export default async function PromotionsPage({
    searchParams,
}: {
    searchParams: Promise<{ dojo?: string; status?: string }>;
}) {
    const params = await searchParams;
    const session = await getSession();
    const isSuperAdmin = session?.role === "SUPER_ADMIN";
    const isStudent = session?.role === "STUDENT";

    const selectedDojo = params.dojo || "ALL";
    const filterStatus = params.status || "ALL";

    const whereCondition: Record<string, unknown> = { status: "ACTIVE" };

    // Nếu là Môn sinh, chỉ truy vấn đúng hồ sơ của chính mình để bảo mật
    if (isStudent && session?.studentId) {
        whereCondition.id = session.studentId;
    } else if (selectedDojo !== "ALL") {
        whereCondition.dojo = selectedDojo;
    }

    const students = await (prisma.student.findMany as unknown as (args: unknown) => Promise<{
        id: string;
        studentCode: string;
        fullName: string;
        currentRank: string;
        joinDate: Date;
        dateOfBirth?: Date | null;
        avatar: string | null;
        dojo: string;
        _count: {
            attendances: number;
        };
    }[]>)({
        where: whereCondition,
        include: {
            _count: {
                select: {
                    attendances: {
                        where: { status: "PRESENT" },
                    },
                },
            },
        },
        orderBy: { fullName: "asc" },
    });

    // 1. Lấy danh sách các kỳ thi thăng đai đã tổ chức để hiển thị chi tiết
    const examSessions = await (prisma as unknown as {
        examSession: {
            findMany: (args: unknown) => Promise<ExamSessionFull[]>;
        };
    }).examSession.findMany({
        orderBy: { examDate: "desc" },
        include: {
            examiners: { orderBy: { order: "asc" } },
            candidates: {
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            studentCode: true,
                            dateOfBirth: true,
                            currentRank: true,
                            dojo: true,
                        },
                    },
                },
            },
        },
    });

    // 2. Lấy danh sách các HLV (title === "SHIDOIN") phục vụ ban chấm thi khi là Super Admin
    let coaches: { id: string; fullName: string; currentRank: string }[] = [];
    if (isSuperAdmin) {
        coaches = await prisma.student.findMany({
            where: {
                status: "ACTIVE",
                title: "SHIDOIN",
            },
            select: {
                id: true,
                fullName: true,
                currentRank: true,
            },
            orderBy: { fullName: "asc" },
        });
    }

    const evaluatedStudents = students.map((s) => {
        const evalData = checkPromotionEligibility(
            s.currentRank,
            s.joinDate,
            s._count.attendances
        );
        return {
            ...s,
            evaluation: evalData,
        };
    });

    const filteredStudents = evaluatedStudents.filter((s) => {
        // Đảm bảo môn sinh chỉ thấy tiến độ của chính mình
        if (isStudent && session?.studentId) {
            if (s.id !== session.studentId) return false;
        }
        if (filterStatus === "ELIGIBLE") return s.evaluation.isEligible;
        if (filterStatus === "IN_PROGRESS") return !s.evaluation.isEligible && !s.evaluation.isMaxRank;
        return true;
    });

    const eligibleCount = evaluatedStudents.filter((s) => s.evaluation.isEligible).length;

    // Lọc danh sách ứng viên thi (chỉ chọn các cấp dưới đai đen)
    const candidates = evaluatedStudents
        .filter((s) => !s.currentRank.toLowerCase().includes("đen"))
        .map((s) => ({
            id: s.id,
            studentCode: s.studentCode,
            fullName: s.fullName,
            currentRank: s.currentRank,
            dateOfBirth: s.dateOfBirth ?? null,
            dojo: s.dojo,
            isEligible: s.evaluation.isEligible,
            suggestedNextRank: s.evaluation.nextRank,
        }));

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Tiêu đề & Bộ lọc */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Về trang chủ</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>Cấp bậc đai</span>
                        {eligibleCount > 0 && !isStudent && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
                                {eligibleCount} đủ điều kiện
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isStudent ? "Theo dõi tiến độ tích lũy buổi tập và thời gian thăng cấp đai của bạn" : "Theo dõi số buổi tập và thời gian sinh hoạt trên thảm để đề xuất thi thăng cấp"}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Nút Tạo kỳ thi thăng đai dành riêng cho Super Admin */}
                    {isSuperAdmin && (
                        <CreateExamModal
                            coaches={coaches}
                            candidates={candidates}
                        />
                    )}

                    {/* Bộ lọc sân và trạng thái (Ẩn với môn sinh vì chỉ thấy hồ sơ của chính mình) */}
                    {!isStudent && (
                        <form
                            method="GET"
                            className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <select
                                name="dojo"
                                defaultValue={selectedDojo}
                                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                            >
                                <option value="ALL" className="dark:bg-slate-900">
                                    Tất cả sân
                                </option>
                                <option value="HAYATE" className="dark:bg-slate-900">
                                    Aikido Hayate
                                </option>
                                <option value="TACHI" className="dark:bg-slate-900">
                                    Sân Tachi
                                </option>
                            </select>

                            <select
                                name="status"
                                defaultValue={filterStatus}
                                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                            >
                                <option value="ALL" className="dark:bg-slate-900">
                                    Tất cả tiến độ
                                </option>
                                <option value="ELIGIBLE" className="dark:bg-slate-900">
                                    Đủ điều kiện thi ngay
                                </option>
                                <option value="IN_PROGRESS" className="dark:bg-slate-900">
                                    Đang tích lũy giờ tập
                                </option>
                            </select>

                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg transition-colors cursor-pointer"
                            >
                                Lọc
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Khối hiển thị chi tiết các kỳ thi đã tạo */}
            <ExamSessionList
                sessions={examSessions}
                isSuperAdmin={isSuperAdmin}
                coaches={coaches}
                candidates={candidates}
                currentStudentId={session?.studentId || null}
            />

            {/* Danh sách thẻ môn sinh xét duyệt */}
            {filteredStudents.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-400">
                    Không có thông tin tiến độ đai phù hợp.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredStudents.map((s) => {
                        const ev = s.evaluation;

                        return (
                            <div
                                key={s.id}
                                className={`p-5 rounded-2xl border transition-all ${ev.isEligible
                                        ? "bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600/80 shadow-md ring-1 ring-emerald-400/30"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            {s.avatar ? (
                                                <Image src={s.avatar} alt={s.fullName} fill className="object-cover" />
                                            ) : (
                                                <span className="font-bold text-sm text-slate-500 uppercase">
                                                    {s.fullName.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-1.5">
                                                <span>{s.fullName}</span>
                                            </h3>
                                            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                <span className="font-mono">{s.studentCode}</span>
                                                <span>•</span>
                                                <span>{s.dojo === "TACHI" ? "Sân Tachi" : "Hayate"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Huy hiệu trạng thái */}
                                    <div className="flex flex-col items-end">
                                        {ev.isEligible ? (
                                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Đủ điều kiện</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{ev.progressPercent}%</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Lộ trình cấp đai */}
                                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                                            Hiện tại
                                        </span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {s.currentRank}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                    <div className="text-right">
                                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                                            Dự kiến thi
                                        </span>
                                        <span className="font-bold text-red-600 dark:text-red-400">
                                            {ev.nextRank}
                                        </span>
                                    </div>
                                </div>

                                {/* Thanh tiến độ tích lũy */}
                                {!ev.isMaxRank && (
                                    <div className="mt-4 space-y-2 text-xs">
                                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                            <span>
                                                Buổi tập: <strong>{ev.attendedSessions}</strong> / {ev.requiredSessions} buổi
                                            </span>
                                            <span>
                                                Thời gian: <strong>{ev.daysActive}</strong> / {ev.requiredDays} ngày
                                            </span>
                                        </div>

                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${ev.isEligible ? "bg-emerald-500" : "bg-red-500"
                                                    }`}
                                                style={{ width: `${ev.progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
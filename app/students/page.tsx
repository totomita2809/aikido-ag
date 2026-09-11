import Link from "next/link";
import { Award, ArrowRight, Calendar, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import StudentTable from "@/components/StudentTable";
import { getDashboardStats } from "@/app/actions/dashboard";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import AuthGuard from "@/components/AuthGuard";

// Bắt buộc Next.js đọc dữ liệu mới nhất từ Neon DB mỗi lần tải trang
export const dynamic = "force-dynamic";

interface ExamDbResult {
    id: string;
    title: string;
    examDate: Date;
    _count: {
        candidates: number;
    };
}

export default async function HomePage() {
    const session = await getSession();

    const students = await prisma.student.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Truy vấn tất cả các kỳ thi thăng cấp đai gần đây để hiển thị đầy đủ
    const activeExams = await (prisma as unknown as {
        examSession: {
            findMany: (args: {
                orderBy: { examDate: "desc" };
                include: { _count: { select: { candidates: true } } };
            }) => Promise<ExamDbResult[]>;
        };
    }).examSession.findMany({
        orderBy: { examDate: "desc" },
        include: {
            _count: {
                select: { candidates: true },
            },
        },
    });

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === "ACTIVE").length;
    const blackBeltCount = students.filter((s) =>
        s.currentRank.toLowerCase().includes("đen")
    ).length;

    // Lấy thời gian hiện tại để truy vấn thống kê vĩ mô tháng/năm
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const stats = await getDashboardStats(currentMonth, currentYear);

    return (
        <AuthGuard>
            <div className="space-y-6">
                {/* Cụm biểu đồ báo cáo vĩ mô */}
                <DashboardAnalytics
                    totalActiveStudents={stats.totalActiveStudents}
                    paidCount={stats.paidCount}
                    unpaidCount={stats.unpaidCount}
                    totalCollected={stats.totalCollected}
                    rankDistribution={stats.rankDistribution}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                />

                {/* Danh sách các kỳ thi thăng đai đang có */}
                {activeExams.length > 0 && (
                    <div className="space-y-3">
                        {activeExams.map((exam) => (
                            <div
                                key={exam.id}
                                className="p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-xs">
                                            <Award className="w-3.5 h-3.5 mr-1" />
                                            Kỳ thi thăng cấp đai
                                        </span>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black tracking-tight">{exam.title}</h3>
                                    <p className="text-xs text-white/90 flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(exam.examDate).toLocaleDateString("vi-VN", {
                                                weekday: "long",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {exam._count.candidates} môn sinh tham dự
                                        </span>
                                    </p>
                                </div>

                                <Link
                                    href="/promotions"
                                    className="self-start sm:self-center shrink-0 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white text-red-600 font-bold text-xs hover:bg-slate-100 shadow-md transition-all active:scale-95 cursor-pointer"
                                >
                                    <span>{session?.role === "SUPER_ADMIN" ? "Quản lý kỳ thi" : "Xem chi tiết"}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bảng danh sách môn sinh gốc */}
                <StudentTable
                    initialStudents={students}
                    totalStudents={totalStudents}
                    activeStudents={activeStudents}
                    blackBeltCount={blackBeltCount}
                    currentUserRole={session?.role}
                    currentStudentId={session?.studentId}
                />
            </div>
        </AuthGuard>
    );
}
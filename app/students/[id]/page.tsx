import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trash2, UserCog, CreditCard, Activity, Calendar, ShieldAlert, KeyRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteStudent } from "@/app/actions/student";
import { getSession } from "@/lib/auth";
import RankHistorySection from "@/components/RankHistorySection";
import StudentAvatarUploader from "@/components/StudentAvatarUploader";
import StudentEditForm from "@/components/StudentEditForm";

export default async function StudentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isManager = session.role === "SUPER_ADMIN" || session.role === "COACH";

    const student = await (prisma.student.findUnique as unknown as (args: unknown) => Promise<{
        id: string;
        studentCode: string;
        fullName: string;
        currentRank: string;
        dojo: string;
        healthNote?: string | null;
        dateOfBirth: Date | null;
        gender: string | null;
        phone: string | null;
        address: string | null;
        avatar?: string | null;
        pendingAvatar?: string | null;
        avatarStatus?: string | null;
        status: string;
        user?: {
            email: string;
            // Nếu hệ thống lưu mật khẩu dạng plaintext hiển thị hoặc lưu ghi chú mật khẩu tạm
            // Dưới đây hiển thị thông tin tài khoản liên kết lấy từ bảng User
        } | null;
        tuitionFees?: {
            id: string;
            month: number;
            year: number;
            amount: number;
            isPaid: boolean;
            paidAt: Date | null;
            paymentMethod?: string | null;
        }[];
        rankHistories?: {
            id: string;
            rank: string;
            examDate: Date;
            examiner?: string | null;
            certificateNo?: string | null;
            notes?: string | null;
        }[];
        attendances?: {
            id: string;
            date: Date;
            isPresent: boolean;
        }[];
    } | null>)({
        where: { id },
        include: {
            user: true,
            tuitionFees: {
                orderBy: [{ year: "desc" }, { month: "desc" }],
                take: 6,
            },
            rankHistories: {
                orderBy: { examDate: "desc" },
            },
            attendances: {
                orderBy: { date: "desc" },
                take: 10,
            },
        },
    });

    if (!student) {
        notFound();
    }

    const isOwner = session.studentId === student.id;

    // Phân quyền: Môn sinh khi xem hồ sơ của môn sinh khác chỉ thấy thông tin cơ bản
    if (!isManager && !isOwner) {
        return (
            <div className="max-w-md mx-auto space-y-6">
                <Link
                    href="/students"
                    className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại danh sách</span>
                </Link>

                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden relative border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {student.avatar ? (
                            <Image src={student.avatar} alt={student.fullName} fill className="object-cover" />
                        ) : (
                            <span className="font-black text-2xl text-slate-400">
                                {student.fullName.charAt(0)}
                            </span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">
                            {student.fullName}
                        </h2>
                        <span className="inline-block mt-2 px-3 py-1 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                            {student.currentRank}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {student.dojo === "TACHI" ? "Sân Tachi" : "Aikido Hayate"}
                        </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Thông tin chi tiết được bảo mật theo quy chế võ đường.</span>
                    </div>
                </div>
            </div>
        );
    }

    const deleteStudentWithId = deleteStudent.bind(null, student.id);

    const dbForCount = prisma as unknown as {
        attendanceRecord?: { count: (args: unknown) => Promise<number> };
        attendance?: { count: (args: unknown) => Promise<number> };
        attendances?: { count: (args: unknown) => Promise<number> };
    };

    const attendanceModel = dbForCount.attendanceRecord || dbForCount.attendance || dbForCount.attendances;
    const totalAttendanceCount = attendanceModel
        ? await attendanceModel.count({ where: { studentId: id, status: "PRESENT" } })
        : 0;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <Link
                    href="/students"
                    className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại danh sách</span>
                </Link>

                {isSuperAdmin && (
                    <form action={deleteStudentWithId}>
                        <button
                            type="submit"
                            className="inline-flex items-center space-x-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa môn sinh</span>
                        </button>
                    </form>
                )}
            </div>

            {/* Thông tin tài khoản đăng nhập (Chỉ HLV Trưởng / SUPER_ADMIN mới nhìn thấy) */}
            {isSuperAdmin && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                                Tài khoản hệ thống & Mật khẩu
                            </h4>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                Tên đăng nhập: <strong className="font-mono text-slate-900 dark:text-white">{student.user?.email || "Chưa cấp tài khoản"}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 text-slate-600 dark:text-slate-300 shadow-2xs">
                        Mật khẩu ban đầu: <code className="font-mono font-bold text-red-600">SĐT hoặc 123456</code> (Đã mã hóa)
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                            <UserCog className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                Cập Nhật Hồ Sơ Môn Sinh
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Mã hồ sơ: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{student.studentCode}</span>
                            </p>
                        </div>
                    </div>

                    <StudentAvatarUploader
                        studentId={student.id}
                        currentAvatar={student.avatar || null}
                        pendingAvatar={student.pendingAvatar || null}
                        avatarStatus={student.avatarStatus || "NONE"}
                    />
                </div>

                {/* Form chỉnh sửa thông tin */}
                <StudentEditForm student={student} />
            </div>

            {/* Thống kê chuyên cần nhanh */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Tổng chuyên cần thực tế</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Số buổi có mặt tích lũy trên thảm tập</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                    {totalAttendanceCount} buổi
                </div>
            </div>

            {/* Lịch sử đóng học phí gần đây */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Lịch sử đóng học phí gần đây
                </h3>

                {!student.tuitionFees || student.tuitionFees.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Chưa có dữ liệu học phí ghi nhận.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-semibold">
                                <tr>
                                    <th className="px-3.5 py-2.5">Kỳ thu</th>
                                    <th className="px-3.5 py-2.5">Số tiền</th>
                                    <th className="px-3.5 py-2.5">Hình thức</th>
                                    <th className="px-3.5 py-2.5 text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {student.tuitionFees.map((fee) => (
                                    <tr key={fee.id}>
                                        <td className="px-3.5 py-3 font-medium text-slate-900 dark:text-white">
                                            Tháng {fee.month}/{fee.year}
                                        </td>
                                        <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300">
                                            {fee.amount.toLocaleString("vi-VN")} đ
                                        </td>
                                        <td className="px-3.5 py-3 text-slate-500">
                                            {fee.paymentMethod || "Tiền mặt"}
                                        </td>
                                        <td className="px-3.5 py-3 text-right">
                                            {fee.isPaid ? (
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                                                    Đã đóng ({fee.paidAt ? new Date(fee.paidAt).toLocaleDateString("vi-VN") : "—"})
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                                                    Chưa đóng
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Lịch sử thi đai */}
            <RankHistorySection
                studentId={student.id}
                rankHistories={student.rankHistories || []}
            />

            {/* Lịch sử điểm danh gần đây */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Lịch sử điểm danh gần đây
                </h3>

                {!student.attendances || student.attendances.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Chưa có dữ liệu điểm danh gần đây.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {student.attendances.map((att) => (
                            <div key={att.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    {new Date(att.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                </p>
                                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${att.isPresent
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                                    }`}>
                                    {att.isPresent ? "Có mặt" : "Vắng"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
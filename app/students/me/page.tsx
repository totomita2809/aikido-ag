import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Edit3, CreditCard, Activity, Calendar, Award } from "lucide-react";
import { getTitleLabel } from "@/utils/titleHelper";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
    const session = await getSession();
    if (!session) {
        redirect("/login");
    }

    if (session.role !== "STUDENT" || !session.studentId) {
        redirect("/students");
    }

    const student = await prisma.student.findUnique({
        where: { id: session.studentId },
        include: {
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
        return <div className="p-8 text-center text-slate-500">Không tìm thấy thông tin hồ sơ liên kết.</div>;
    }

    const studentData = student as typeof student & { parentPhone?: string | null };

    // Tính tổng số buổi có mặt dựa trên trường status của bảng attendance
    const totalAttendanceCount = await prisma.attendance.count({
        where: { studentId: student.id, status: "PRESENT" },
    }).catch(() => 0);

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Hồ sơ môn sinh cá nhân
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Thông tin chi tiết và quá trình luyện tập của bạn tại võ đường.
                        </p>
                    </div>
                </div>

                <Link
                    href="/students/me/edit"
                    className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shrink-0"
                >
                    <Edit3 className="w-4 h-4" />
                    <span>Yêu cầu sửa đổi</span>
                </Link>
            </div>

            {/* Thông tin chính */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 text-center sm:text-left">
                    <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border-2 border-red-500/30 flex items-center justify-center font-bold text-xl text-slate-400">
                        {student.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={student.avatar} alt={student.fullName} className="w-full h-full object-cover" />
                        ) : (
                            student.fullName.charAt(0)
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="inline-block px-2.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-mono text-xs font-bold">
                            {student.studentCode}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {student.fullName}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Cấp đai: <span className="font-bold text-slate-800 dark:text-slate-200">{student.currentRank || "Chưa xếp"}</span> | Tước vị: <span className="font-bold text-slate-800 dark:text-slate-200">{getTitleLabel(student.title)}</span> | Sân: <span className="font-bold text-slate-800 dark:text-slate-200">{student.dojo === "TACHI" ? "Sân Tachi" : "Aikido Hayate"}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Số điện thoại cá nhân</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{student.phone || "Chưa cập nhật"}</div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Số điện thoại phụ huynh</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{studentData.parentPhone || "Không có"}</div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ngày sinh & Giới tính</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa cập nhật"} • {student.gender || "Nam"}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email liên hệ</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{student.email || "Chưa cập nhật"}</div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Địa chỉ thường trú</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{student.address || "Chưa cập nhật"}</div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ngày gia nhập võ đường</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {student.joinDate ? new Date(student.joinDate).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                        </div>
                    </div>
                </div>

                {student.healthNote && (
                    <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-1">
                        <span className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[10px]">Tình trạng sức khỏe & Lưu ý bệnh lý</span>
                        <div className="text-amber-800 dark:text-amber-200 leading-relaxed">{student.healthNote}</div>
                    </div>
                )}
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

            {/* Lịch sử đóng học phí */}
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
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Lịch sử thăng cấp đai
                </h3>

                {!student.rankHistories || student.rankHistories.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Chưa có lịch sử thi đai ghi nhận.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-semibold">
                                <tr>
                                    <th className="px-3.5 py-2.5">Cấp đai đạt được</th>
                                    <th className="px-3.5 py-2.5">Ngày xét duyệt</th>
                                    <th className="px-3.5 py-2.5">Hội đồng chấm thi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {student.rankHistories.map((rh) => (
                                    <tr key={rh.id}>
                                        <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-white">
                                            {rh.rank}
                                        </td>
                                        <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300">
                                            {new Date(rh.examDate).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="px-3.5 py-3 text-slate-500">
                                            {rh.examiner || "Hội đồng võ đường"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Lịch sử điểm danh gần đây */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Lịch sử điểm danh gần đây
                </h3>

                {!student.attendances || student.attendances.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Chưa có dữ liệu điểm danh gần đây.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                        {student.attendances.map((att) => {
                            const isPresent = att.status === "PRESENT";
                            return (
                                <div key={att.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {new Date(att.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                    </p>
                                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${isPresent
                                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                                            : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                                        }`}>
                                        {isPresent ? "Có mặt" : "Vắng"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
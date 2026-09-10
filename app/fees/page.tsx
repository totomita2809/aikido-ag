import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, CreditCard, MapPin, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ExportButton from "@/components/ExportButton";
import FeeTableRows from "@/components/FeeTableRows";
import { DOJO_CONFIGS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function FeesPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string; dojo?: string }>;
}) {
    const params = await searchParams;
    const now = new Date();
    const currentMonth = params.month ? Number(params.month) : now.getMonth() + 1;
    const currentYear = params.year ? Number(params.year) : now.getFullYear();
    const selectedDojo = params.dojo || "ALL"; // "ALL" | "HAYATE" | "TACHI"

    // Tính quý tương ứng nếu xem sân Tachi
    const currentQuarter = Math.ceil(currentMonth / 3);

    const whereCondition: Record<string, unknown> = { status: "ACTIVE" };
    if (selectedDojo !== "ALL") {
        whereCondition.dojo = selectedDojo;
    }

    const students = await (prisma.student.findMany as unknown as (args: unknown) => Promise<{
        id: string;
        studentCode: string;
        fullName: string;
        avatar?: string | null;
        currentRank: string;
        dojo?: string;
        status: string;
        tuitionFees?: {
            id: string;
            month: number;
            year: number;
            amount: number;
            isPaid: boolean;
            paidAt: Date | null;
            paymentMethod?: string | null;
            receiptUrl?: string | null;
        }[];
    }[]>)({
        where: whereCondition,
        include: {
            tuitionFees: {
                where: {
                    month: currentMonth,
                    year: currentYear,
                },
            },
        },
        orderBy: { fullName: "asc" },
    });

    const getStudentFeeConfig = (dojo?: string) => {
        if (dojo === DOJO_CONFIGS.TACHI.key) {
            return {
                amount: DOJO_CONFIGS.TACHI.feeAmount,
                cycleLabel: `Quý ${currentQuarter} (3 tháng)`,
                dojoName: DOJO_CONFIGS.TACHI.name,
                mapUrl: DOJO_CONFIGS.TACHI.mapUrl,
            };
        }
        return {
            amount: DOJO_CONFIGS.HAYATE.feeAmount,
            cycleLabel: `Tháng ${currentMonth}`,
            dojoName: DOJO_CONFIGS.HAYATE.name,
            mapUrl: DOJO_CONFIGS.HAYATE.mapUrl,
        };
    };

    const totalActive = students.length;
    const paidCount = students.filter(
        (s) => s.tuitionFees && s.tuitionFees.length > 0 && s.tuitionFees[0].isPaid
    ).length;
    const unpaidCount = totalActive - paidCount;

    // Tính tổng tiền dựa theo từng sân của môn sinh đã nộp
    const totalCollected = students.reduce((sum, s) => {
        const isPaid = s.tuitionFees && s.tuitionFees.length > 0 && s.tuitionFees[0].isPaid;
        if (isPaid) {
            const config = getStudentFeeConfig(s.dojo);
            return sum + config.amount;
        }
        return sum;
    }, 0);

    const formattedStudents = students.map((student) => {
        const fee = student.tuitionFees && student.tuitionFees[0];
        return {
            id: student.id,
            studentCode: student.studentCode,
            fullName: student.fullName,
            avatar: student.avatar,
            dojo: student.dojo,
            feeConfig: getStudentFeeConfig(student.dojo),
            isPaid: !!(fee && fee.isPaid),
            paidAt: fee?.paidAt || null,
            paymentMethod: fee?.paymentMethod || "Tiền mặt",
            receiptUrl: fee?.receiptUrl || null,
            month: currentMonth,
            year: currentYear,
        };
    });

    return (
        <div className="space-y-6">
            {/* Thanh điều hướng và tiêu đề */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        href="/students"
                        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Về trang quản lý</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        Quản Lý Học Phí
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Theo dõi tình trạng thu nộp theo cơ sở tập luyện
                    </p>
                </div>

                {/* Bộ lọc Sân tập, Thời gian & Nút Xuất Excel */}
                <div className="flex flex-wrap items-center gap-2">
                    <ExportButton type="FEES" dojo={selectedDojo} year={currentYear} />
                    <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <form method="GET" className="flex flex-wrap items-center gap-2">
                            <select
                                name="dojo"
                                defaultValue={selectedDojo}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                            >
                                <option value="ALL" className="dark:bg-slate-900">Tất cả sân</option>
                                <option value={DOJO_CONFIGS.HAYATE.key} className="dark:bg-slate-900">{DOJO_CONFIGS.HAYATE.name} ({(DOJO_CONFIGS.HAYATE.feeAmount / 1000)}k/tháng)</option>
                                <option value={DOJO_CONFIGS.TACHI.key} className="dark:bg-slate-900">{DOJO_CONFIGS.TACHI.name} ({(DOJO_CONFIGS.TACHI.feeAmount / 1000)}k/quý)</option>
                            </select>

                            <select
                                name="month"
                                defaultValue={currentMonth}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m} className="dark:bg-slate-900">
                                        Tháng {m}
                                    </option>
                                ))}
                            </select>

                            <select
                                name="year"
                                defaultValue={currentYear}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none"
                            >
                                {[2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y} className="dark:bg-slate-900">
                                        Năm {y}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg transition-colors"
                            >
                                Lọc
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Thông tin 2 sân tập */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 mb-1">
                            Sân 1
                        </span>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{DOJO_CONFIGS.HAYATE.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Học phí: <strong className="text-slate-800 dark:text-slate-200">{DOJO_CONFIGS.HAYATE.feeAmount.toLocaleString("vi-VN")} đ / tháng</strong>
                        </p>
                    </div>
                    <a
                        href={DOJO_CONFIGS.HAYATE.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg"
                    >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Xem bản đồ</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 mb-1">
                            Sân 2
                        </span>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{DOJO_CONFIGS.TACHI.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Học phí: <strong className="text-slate-800 dark:text-slate-200">{DOJO_CONFIGS.TACHI.feeAmount.toLocaleString("vi-VN")} đ / quý (3 tháng)</strong>
                        </p>
                    </div>
                    <a
                        href={DOJO_CONFIGS.TACHI.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg"
                    >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Xem bản đồ</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* Thẻ thống kê tài chính */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                            Đã thu (Tháng {currentMonth})
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {paidCount} / {totalActive}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                            Chưa hoàn thành
                        </p>
                        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            {unpaidCount}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                            Tổng tiền thực thu
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {totalCollected.toLocaleString("vi-VN")} đ
                        </p>
                    </div>
                </div>
            </div>

            {/* Bảng danh sách trạng thái đóng học phí */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Danh sách môn sinh - Tháng {currentMonth}/{currentYear}
                    </h2>
                    <span className="text-xs text-slate-400">
                        {selectedDojo === DOJO_CONFIGS.TACHI.key ? "Thu định kỳ theo Quý" : selectedDojo === DOJO_CONFIGS.HAYATE.key ? "Thu định kỳ hàng Tháng" : "Toàn bộ cơ sở"}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-5 py-3.5">Mã số</th>
                                <th className="px-5 py-3.5">Họ và tên</th>
                                <th className="px-5 py-3.5">Sân tập</th>
                                <th className="px-5 py-3.5">Mức thu</th>
                                <th className="px-5 py-3.5">Ngày đóng</th>
                                <th className="px-5 py-3.5 text-right">Tình trạng</th>
                            </tr>
                        </thead>
                        <FeeTableRows students={formattedStudents} />
                    </table>
                </div>
            </div>
        </div>
    );
}
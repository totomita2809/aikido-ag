import { CheckCircle2, Clock, CreditCard, Users, Award } from "lucide-react";

interface RankStat {
    rank: string;
    count: number;
}

interface DashboardAnalyticsProps {
    totalActiveStudents: number;
    paidCount: number;
    unpaidCount: number;
    totalCollected: number;
    rankDistribution: RankStat[];
    currentMonth: number;
    currentYear: number;
}

export default function DashboardAnalytics({
    totalActiveStudents,
    paidCount,
    unpaidCount,
    totalCollected,
    rankDistribution,
    currentMonth,
    currentYear,
}: DashboardAnalyticsProps) {
    const paymentRate = totalActiveStudents > 0 ? Math.round((paidCount / totalActiveStudents) * 100) : 0;

    return (
        <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Tổng Quan Hoạt Động Võ Đường
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Báo cáo vĩ mô tháng {currentMonth}/{currentYear}
                    </p>
                </div>
            </div>

            {/* Các thẻ chỉ số tài chính & nhân sự */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase font-bold text-slate-400">Tổng môn sinh hoạt động</p>
                        <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                            {totalActiveStudents}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase font-bold text-slate-400">Đã đóng học phí</p>
                        <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {paidCount} <span className="text-xs font-normal text-slate-400">({paymentRate}%)</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase font-bold text-slate-400">Chưa hoàn thành</p>
                        <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                            {unpaidCount}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase font-bold text-slate-400">Tổng thu thực tế</p>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                            {totalCollected.toLocaleString("vi-VN")} đ
                        </p>
                    </div>
                </div>
            </div>

            {/* Phần biểu đồ trực quan phân bổ cấp đai */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Phân Bổ Cấp Đai Môn Sinh (Belt Distribution)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    {rankDistribution.map((item) => {
                        const percentage = totalActiveStudents > 0 ? Math.round((item.count / totalActiveStudents) * 100) : 0;
                        return (
                            <div key={item.rank} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-slate-700 dark:text-slate-300">{item.rank}</span>
                                    <span className="text-slate-900 dark:text-white font-bold">{item.count} võ sinh ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-red-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
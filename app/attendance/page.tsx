import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import AttendanceSheet from "@/components/AttendanceSheet";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const params = await searchParams;
    const today = new Date();
    const selectedDateStr = params.date || today.toISOString().split("T")[0];

    const currentDateObj = new Date(selectedDateStr);
    const dayOfWeek = currentDateObj.getDay();

    // Thứ 2, 4, 6 (1, 3, 5) -> Sân chính Tachi, Sân phụ Hayate
    // Thứ 3, 5, 7 và CN -> Sân chính Hayate, Sân phụ Tachi
    const isTachiDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
    const primaryDojoKey = isTachiDay ? "TACHI" : "HAYATE";
    const guestDojoKey = isTachiDay ? "HAYATE" : "TACHI";

    const primaryDojoName = isTachiDay ? "Sân Tachi" : "Aikido Hayate";
    const guestDojoName = isTachiDay ? "Aikido Hayate" : "Sân Tachi";

    const dayNames = [
        "Chủ Nhật",
        "Thứ Hai (2)",
        "Thứ Ba (3)",
        "Thứ Tư (4)",
        "Thứ Năm (5)",
        "Thứ Sáu (6)",
        "Thứ Bảy (7)",
    ];
    const dayOfWeekName = dayNames[dayOfWeek];

    const targetDate = new Date(selectedDateStr);
    targetDate.setHours(0, 0, 0, 0);

    const db = prisma as unknown as {
        student: {
            findMany: (args: unknown) => Promise<{
                id: string;
                studentCode: string;
                fullName: string;
                currentRank: string;
                phone: string | null;
                address: string | null;
                joinDate: Date;
                dojo: string;
                avatar?: string | null; // Thêm dòng này
                attendances?: {
                    status: string;
                }[];
            }[]>;
        };
    };

    const allActiveStudents = await db.student.findMany({
        where: { status: "ACTIVE" },
        include: {
            attendances: {
                where: {
                    date: targetDate,
                },
            },
        },
        orderBy: { fullName: "asc" },
    });

    const formatList = (list: typeof allActiveStudents) =>
        list.map((s) => ({
            id: s.id,
            studentCode: s.studentCode,
            fullName: s.fullName,
            currentRank: s.currentRank,
            phone: s.phone,
            joinDate: s.joinDate,
            parentPhone: s.phone,
            avatarUrl: s.avatar || null, // Lấy link avatar từ DB
            dojo: s.dojo,
            isPresentInitial: Boolean(
                s.attendances && s.attendances.length > 0 && s.attendances[0].status === "PRESENT"
            ),
        }));

    const primaryList = formatList(allActiveStudents.filter((s) => s.dojo === primaryDojoKey));
    const guestList = formatList(allActiveStudents.filter((s) => s.dojo === guestDojoKey));

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <Link
                        href="/students"
                        className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Về trang quản lý</span>
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>Điểm Danh: {dayOfWeekName}</span>
                    </h1>
                    <div className="flex items-center space-x-2 mt-1">
                        <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold ${isTachiDay
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                }`}
                        >
                            <MapPin className="w-3 h-3" />
                            <span>{primaryDojoName}</span>
                        </span>
                        <span className="text-xs text-slate-400">
                            ({isTachiDay ? "Lịch tập Thứ 2-4-6" : "Lịch tập Thứ 3-5-7"})
                        </span>
                    </div>
                </div>

                <form method="GET" className="flex items-center space-x-2 self-start sm:self-auto">
                    <input
                        type="date"
                        name="date"
                        defaultValue={selectedDateStr}
                        className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg transition-colors"
                    >
                        Đổi ngày
                    </button>
                </form>
            </div>

            <AttendanceSheet
                primaryStudents={primaryList}
                guestStudents={guestList}
                selectedDate={selectedDateStr}
                primaryDojoName={primaryDojoName}
                guestDojoName={guestDojoName}
            />
        </div>
    );
}
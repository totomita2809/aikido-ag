import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, X, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { approveAvatar, rejectAvatar } from "@/app/actions/avatar";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PendingAvatarsPage() {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        redirect("/students");
    }

    const db = prisma as unknown as {
        student: {
            findMany: (args: unknown) => Promise<{
                id: string;
                studentCode: string;
                fullName: string;
                currentRank: string;
                dojo: string;
                avatar: string | null;
                pendingAvatar: string | null;
                updatedAt: Date;
            }[]>;
        };
    };

    const pendingStudents = await db.student.findMany({
        where: {
            avatarStatus: "PENDING",
            pendingAvatar: { not: null },
        },
        orderBy: { updatedAt: "desc" },
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/students"
                        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Về trang quản lý</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>Duyệt Ảnh Thẻ Môn Sinh</span>
                        {pendingStudents.length > 0 && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-600 text-white">
                                {pendingStudents.length} yêu cầu
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kiểm tra và phê duyệt ảnh thẻ đúng quy định trang phục trong vòng 48 giờ
                    </p>
                </div>
            </div>

            {pendingStudents.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                        Không có ảnh nào cần duyệt!
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Tất cả ảnh thẻ của môn sinh đều đã được xử lý hoặc chưa có yêu cầu mới.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pendingStudents.map((student) => (
                        <div
                            key={student.id}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                            {/* So sánh ảnh cũ và ảnh mới */}
                            <div className="flex items-center space-x-6">
                                <div className="text-center">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                        Ảnh hiện tại
                                    </span>
                                    <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        {student.avatar ? (
                                            <Image src={student.avatar} alt="Ảnh cũ" fill className="object-cover" />
                                        ) : (
                                            <span className="text-xs text-slate-400">Trống</span>
                                        )}
                                    </div>
                                </div>

                                <span className="text-slate-300 dark:text-slate-700 font-bold">➔</span>

                                <div className="text-center">
                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
                                        Ảnh mới gửi
                                    </span>
                                    <div className="relative w-16 h-20 rounded-lg overflow-hidden border-2 border-emerald-500 shadow-md">
                                        <Image
                                            src={student.pendingAvatar!}
                                            alt="Ảnh chờ duyệt"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Thông tin môn sinh */}
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                            {student.fullName}
                                        </h4>
                                        <span className="text-xs font-mono text-slate-400">({student.studentCode})</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Sân tập: <strong className="text-slate-700 dark:text-slate-300">{student.dojo === "TACHI" ? "Sân Tachi" : "Aikido Hayate"}</strong>
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Cấp đai: <strong className="text-red-600 dark:text-red-400">{student.currentRank}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Nút hành động */}
                            <div className="flex items-center space-x-2.5 self-end sm:self-center">
                                <form
                                    action={async () => {
                                        "use server";
                                        await rejectAvatar(student.id);
                                    }}
                                >
                                    <button
                                        type="submit"
                                        className="inline-flex items-center space-x-1 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Từ chối</span>
                                    </button>
                                </form>

                                <form
                                    action={async () => {
                                        "use server";
                                        await approveAvatar(student.id);
                                    }}
                                >
                                    <button
                                        type="submit"
                                        className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Duyệt ảnh này</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
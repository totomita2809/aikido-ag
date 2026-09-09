import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Edit3 } from "lucide-react";

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
    });

    if (!student) {
        return <div className="p-8 text-center text-slate-500">Không tìm thấy thông tin hồ sơ liên kết.</div>;
    }

    const studentData = student as typeof student & { parentPhone?: string | null };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
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
                    className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                    <Edit3 className="w-4 h-4" />
                    <span>Yêu cầu sửa đổi</span>
                </Link>
            </div>

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
                            Cấp đai: <span className="font-bold text-slate-800 dark:text-slate-200">{student.currentRank || "Chưa xếp"}</span> | Tước vị: <span className="font-bold text-slate-800 dark:text-slate-200">{student.title || "Môn sinh"}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Số điện thoại cá nhân</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{student.phone || "Chưa cập nhật"}</div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Số điện thoại phụ huynh</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{studentData.parentPhone || "Không có"}</div>
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
            </div>
        </div>
    );
}
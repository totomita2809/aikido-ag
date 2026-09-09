import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Shield, Calendar, Users, MapPin, Award, ArrowRight, Phone, Mail, Sparkles } from "lucide-react";


export default async function PublicHomePage() {
    const session = await getSession();

    return (
        <div className="space-y-16 pb-16">
            {/* 1. HERO SECTION */}
            <section className="relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-8 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_50%)]" />
                <div className="relative z-10 max-w-2xl space-y-6">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Võ đường Aikido An Giang</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-tight text-slate-900 dark:text-white">
                        Tinh hoa võ đạo <br />
                        <span className="text-red-600 dark:text-red-500">Rèn luyện thân tâm</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                        Chào mừng bạn đến với trang chính thức của võ đường Aikido An Giang. Nơi rèn luyện kỹ năng tự vệ, tinh thần kỷ luật và phát triển bản thân.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        {session ? (
                            <Link
                                href="/students"
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center space-x-2"
                            >
                                <span>Vào hệ thống quản lý</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                            >
                                <span>Đăng nhập hệ thống nội bộ</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                        <a
                            href="#schedule"
                            className="px-6 py-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                            Xem lịch tập luyện
                        </a>
                    </div>
                </div>
            </section>

            {/* 2. CORE VALUES */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                        <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Tự vệ hiệu quả</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Sử dụng đòn thế linh hoạt để hóa giải lực tấn công, không dùng sức chống lại sức.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Môi trường gắn kết</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Tập thể đoàn kết, hỗ trợ lẫn nhau trong luyện tập và đời sống, phù hợp cho mọi lứa tuổi.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                        <Award className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Hệ thống đai chuẩn</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Chương trình đào tạo và xét thăng cấp đai minh bạch theo chuẩn liên đoàn Aikido.
                    </p>
                </div>
            </section>

            {/* 3. SCHEDULE */}
            <section id="schedule" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Lịch tập luyện định kỳ</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Các lớp học diễn ra xuyên suốt trong tuần tại võ đường An Giang.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                        <span className="px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-[10px]">THỨ 3 & THỨ 5</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">18:00 - 20:00</div>
                        <p className="text-slate-500 dark:text-slate-400">Lớp cơ bản & kỹ thuật đòn căn bản cho môn sinh mới.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                        <span className="px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-[10px]">THỨ 7 & CHỦ NHẬT</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">16:30 - 18:30</div>
                        <p className="text-slate-500 dark:text-slate-400">Lớp nâng cao, luyện kiếm (Bokken) và gậy (Jo).</p>
                    </div>
                </div>
            </section>

            {/* 4. CONTACT */}
            <section className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="space-y-2 text-center sm:text-left">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Liên hệ nhập môn</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Đăng ký tham gia lớp học Aikido tại An Giang.</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center space-x-1.5"><MapPin className="w-4 h-4 text-red-600 dark:text-red-500" /><span>An Giang, Việt Nam</span></span>
                        <span className="flex items-center space-x-1.5"><Phone className="w-4 h-4 text-red-600 dark:text-red-500" /><span>Liên hệ HLV Trưởng</span></span>
                        <span className="flex items-center space-x-1.5"><Mail className="w-4 h-4 text-red-600 dark:text-red-500" /><span>aikidoangiang@dojo.com</span></span>
                    </div>
                </div>
                {!session && (
                    <Link
                        href="/login"
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                    >
                        Đăng nhập tài khoản
                    </Link>
                )}
            </section>
        </div>
    );
}
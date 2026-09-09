"use client";

import { Award, Calendar, CheckCircle2, UserCheck } from "lucide-react";
import { addRankHistory } from "@/app/actions/student";

interface RankHistoryItem {
    id: string;
    rank: string;
    examDate: Date;
    examiner?: string | null;
    certificateNo?: string | null;
    notes?: string | null;
}

interface Props {
    studentId: string;
    rankHistories: RankHistoryItem[];
}

export default function RankHistorySection({ studentId, rankHistories }: Props) {
    const addRankAction = addRankHistory.bind(null, studentId);

    return (
        <div className="space-y-6 pt-6">
            {/* Form nhập kết quả thi đai */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <Award className="w-5 h-5 text-red-600" />
                    <span>Ghi Nhận Kỳ Thi Thăng Đai</span>
                </h3>

                <form action={addRankAction} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Cấp đai đạt được <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="rank"
                            required
                            defaultValue="Đai xanh 1 vạch"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        >
                            <optgroup label="1. Nhập môn">
                                <option value="Đai Trắng">Đai Trắng</option>
                            </optgroup>
                            <optgroup label="2. Giai đoạn Đai Xanh">
                                <option value="Đai xanh 1 vạch">Đai xanh 1 vạch</option>
                                <option value="Đai xanh 2 vạch">Đai xanh 2 vạch</option>
                                <option value="Đai xanh 3 vạch">Đai xanh 3 vạch</option>
                            </optgroup>
                            <optgroup label="3. Giai đoạn Đai Nâu">
                                <option value="Đai nâu 1 vạch">Đai nâu 1 vạch</option>
                                <option value="Đai nâu 2 vạch">Đai nâu 2 vạch</option>
                                <option value="Đai nâu 3 vạch">Đai nâu 3 vạch (Dự bị Shodan)</option>
                            </optgroup>
                            <optgroup label="4. Giai đoạn Đai Đen (Hakama)">
                                <option value="Đai đen (Shodan)">Đai đen - Shodan (1 Dan)</option>
                                <option value="Đai đen (Nidan)">Đai đen - Nidan (2 Dan)</option>
                                <option value="Đai đen (Sandan)">Đai đen - Sandan (3 Dan)</option>
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Ngày thi / Thăng cấp
                        </label>
                        <input
                            type="date"
                            name="examDate"
                            defaultValue={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Giám khảo / HLV chấm thi
                        </label>
                        <input
                            type="text"
                            name="examiner"
                            placeholder="VD: Võ sư phụ trách..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Số hiệu văn bằng
                        </label>
                        <input
                            type="text"
                            name="certificateNo"
                            placeholder="VD: VB-2026-001"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nhận xét bài thi
                        </label>
                        <input
                            type="text"
                            name="notes"
                            placeholder="Kỹ thuật đòn thế, Ukemi, thể lực..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div className="sm:col-span-2 flex justify-end pt-2">
                        <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            Lưu kết quả thăng đai
                        </button>
                    </div>
                </form>
            </div>

            {/* Dòng thời gian lịch sử đai */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                    Hành Trình Thăng Tiến Đai
                </h3>

                {rankHistories.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                        Môn sinh chưa tham gia kỳ thi thăng cấp nào.
                    </p>
                ) : (
                    <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                        {rankHistories.map((item) => (
                            <div key={item.id} className="relative group">
                                <div className="absolute -left-[31px] top-1 bg-red-600 text-white p-1 rounded-full ring-4 ring-white dark:ring-slate-900">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="font-semibold text-slate-900 dark:text-white text-base">
                                            {item.rank}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(item.examDate).toLocaleDateString("vi-VN")}</span>
                                        </span>
                                    </div>

                                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                        {item.examiner && (
                                            <p className="flex items-center space-x-1">
                                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Giám khảo: <strong>{item.examiner}</strong></span>
                                            </p>
                                        )}
                                        {item.certificateNo && (
                                            <p>Số bằng: <span className="font-mono font-medium">{item.certificateNo}</span></p>
                                        )}
                                        {item.notes && (
                                            <p className="italic text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700 mt-2">
                                                &ldquo;{item.notes}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
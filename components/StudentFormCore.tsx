"use client";

import { AIKIDO_RANKS, DOJO_CONFIGS } from "@/lib/constants";

export interface StudentFormData {
    id?: string;
    studentCode?: string;
    fullName: string;
    currentRank: string;
    gender: string | null;
    phone: string | null;
    parentPhone?: string | null;
    email?: string | null;
    address?: string | null;
    dateOfBirth?: string | null;
    healthNote?: string | null;
    dojo?: string;
    joinDate?: string | null;
    status: string;
    title: string;
}

interface StudentFormCoreProps {
    formData: Record<string, string>;
    onChange: (field: string, value: string) => void;
    readOnlyCode?: boolean;
}

export default function StudentFormCore({ formData, onChange, readOnlyCode = false }: StudentFormCoreProps) {
    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        onChange(e.target.name, e.target.value);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mã số</label>
                <input
                    type="text"
                    name="studentCode"
                    value={formData.studentCode || ""}
                    onChange={handleFieldChange}
                    readOnly={readOnlyCode}
                    className={`w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono ${readOnlyCode ? "opacity-60 cursor-not-allowed" : ""}`}
                />
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Họ và tên *</label>
                <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName || ""}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                />
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cấp đai</label>
                <select
                    name="currentRank"
                    value={formData.currentRank || AIKIDO_RANKS[0]}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                >
                    {AIKIDO_RANKS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sân tập (Dojo)</label>
                <select
                    name="dojo"
                    value={formData.dojo || DOJO_CONFIGS.HAYATE.key}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                >
                    <option value={DOJO_CONFIGS.HAYATE.key}>{DOJO_CONFIGS.HAYATE.name}</option>
                    <option value={DOJO_CONFIGS.TACHI.key}>{DOJO_CONFIGS.TACHI.name}</option>
                    <option value="BOTH">Cả 2 sân</option>
                </select>
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Chức vụ / Title</label>
                <select
                    name="title"
                    value={formData.title || "MEMBER"}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                >
                    <option value="MEMBER">Môn sinh</option>
                    <option value="SHIDOIN">Huấn luyện viên (Shidoin)</option>
                </select>
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ngày sinh</label>
                <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                />
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Giới tính</label>
                <select
                    name="gender"
                    value={formData.gender || "Nam"}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                </select>
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Trạng thái</label>
                <select
                    name="status"
                    value={formData.status || "ACTIVE"}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                >
                    <option value="ACTIVE">Đang tập</option>
                    <option value="INACTIVE">Tạm nghỉ</option>
                </select>
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Số điện thoại</label>
                <input
                    type="text"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono"
                />
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">SĐT phụ huynh</label>
                <input
                    type="text"
                    name="parentPhone"
                    value={formData.parentPhone || ""}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono"
                />
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                />
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Địa chỉ</label>
                <input
                    type="text"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                />
            </div>
            <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ghi chú sức khỏe</label>
                <input
                    type="text"
                    name="healthNote"
                    value={formData.healthNote || ""}
                    onChange={handleFieldChange}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                />
            </div>
        </div>
    );
}
"use client";

import { Shield, KeyRound } from "lucide-react";
import { STUDENT_TITLES } from "@/lib/constants";

interface Props {
    title: string;
    onTitleChange: (newTitle: string) => void;
    permissions?: Record<string, string>;
    onPermissionChange?: (field: string, value: string) => void;
    isSuperAdmin?: boolean;
}

const FIELDS = [
    { key: "canEditFullName", label: "Họ và tên" },
    { key: "canEditRank", label: "Cấp đai" },
    { key: "canEditDojo", label: "Sân tập trực thuộc" },
    { key: "canEditDob", label: "Ngày sinh" },
    { key: "canEditGender", label: "Giới tính" },
    { key: "canEditPhone", label: "Số điện thoại" },
    { key: "canEditAddress", label: "Địa chỉ thường trú" },
    { key: "canEditHealth", label: "Ghi chú sức khỏe & bệnh lý" },
    { key: "canEditStatus", label: "Trạng thái tập luyện" },
];

const PERMISSION_OPTIONS = [
    { label: "Chỉnh sửa", value: "EDIT" },
    { label: "Chỉ xem", value: "VIEW" },
];

export default function CoachPermissionSettings({
    title,
    onTitleChange,
    permissions = {},
    onPermissionChange,
    isSuperAdmin = true,
}: Props) {
    const isShidoin = title === "SHIDOIN";

    return (
        <div className="space-y-4 pt-2">
            {/* Lựa chọn chức vị */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Chức vị phụ trách trong võ đường
                </label>
                <select
                    name="title"
                    value={title}
                    disabled={!isSuperAdmin}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <option value="MEMBER">{STUDENT_TITLES.MEMBER}</option>
                    <option value="FUKU_SHIDOSHA">{STUDENT_TITLES.FUKU_SHIDOSHA}</option>
                    <option value="SHIDOSHA">{STUDENT_TITLES.SHIDOSHA}</option>
                    <option value="SHIDOIN">{STUDENT_TITLES.SHIDOIN}</option>
                </select>
            </div>

            {/* Bảng phân quyền chi tiết (Chỉ mở khi chức vụ là Shidoin) */}
            {isShidoin && (
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-300 pb-2 border-b border-indigo-200/60 dark:border-indigo-800/60">
                        <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                            Phân quyền thao tác hệ thống dành cho HLV (Shidoin)
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Mục 1: Thêm mới */}
                        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Thêm mới Môn sinh
                            </span>
                            <div className="flex items-center space-x-3">
                                {PERMISSION_OPTIONS.map((opt) => (
                                    <label key={opt.value} className="inline-flex items-center space-x-1 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <input
                                            type="radio"
                                            name="canCreateStudent"
                                            value={opt.value}
                                            defaultChecked={(permissions.canCreateStudent || "VIEW") === opt.value}
                                            disabled={!isSuperAdmin}
                                            onChange={(e) => onPermissionChange?.("canCreateStudent", e.target.value)}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Mã môn sinh cố định */}
                        <div className="flex items-center justify-between p-2.5 bg-slate-100/70 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 opacity-60">
                            <span className="text-slate-500 dark:text-slate-400">
                                Mã môn sinh (Cố định theo sân)
                            </span>
                            <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                                Khóa cứng
                            </span>
                        </div>

                        {/* Danh sách từng trường cho phép sửa */}
                        {FIELDS.map((item) => (
                            <div
                                key={item.key}
                                className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    Sửa {item.label}
                                </span>
                                <div className="flex items-center space-x-3">
                                    {PERMISSION_OPTIONS.map((opt) => (
                                        <label key={opt.value} className="inline-flex items-center space-x-1 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <input
                                                type="radio"
                                                name={item.key}
                                                value={opt.value}
                                                defaultChecked={(permissions[item.key] || "VIEW") === opt.value}
                                                disabled={!isSuperAdmin}
                                                onChange={(e) => onPermissionChange?.(item.key, e.target.value)}
                                                className="text-red-600 focus:ring-red-500"
                                            />
                                            <span>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center space-x-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40">
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        <span>
                            Chức năng <strong>Xóa môn sinh</strong> được bảo vệ: Chỉ duy nhất <strong>HLV Trưởng</strong> mới có quyền xóa.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
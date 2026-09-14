"use client";

import React, { useState, useTransition } from "react";
import StudentFormCore from "@/components/StudentFormCore";
import CoachPermissionSettings from "@/components/CoachPermissionSettings";
import { updateStudent } from "@/app/actions/student";

export interface StudentEditPayload {
    id: string;
    studentCode: string;
    fullName: string;
    currentRank: string;
    gender: string | null;
    phone: string | null;
    parentPhone?: string | null;
    email?: string | null;
    address?: string | null;
    dateOfBirth?: Date | string | null;
    healthNote?: string | null;
    dojo?: string | null;
    joinDate?: Date | string | null;
    status: string;
    title: string;
    user?: {
        id?: string;
        username?: string | null;
        email?: string;
        passwordHash?: string | null;
        role?: string;
        permissions?: Record<string, string> | null;
    } | null;
}

export interface StudentEditFormProps {
    student: StudentEditPayload;
    currentUserRole?: string;
    onClose?: () => void;
}

export default function StudentEditForm({ student, currentUserRole, onClose }: StudentEditFormProps) {
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<string | null>(null);

    const [formState, setFormState] = useState<Record<string, string>>({
        studentCode: student.studentCode || "",
        fullName: student.fullName || "",
        currentRank: student.currentRank || "",
        dojo: student.dojo || "HAYATE",
        title: student.title || "MEMBER",
        gender: student.gender || "Nam",
        dateOfBirth: student.dateOfBirth
            ? new Date(student.dateOfBirth).toISOString().split("T")[0]
            : "",
        status: student.status || "ACTIVE",
        phone: student.phone || "",
        parentPhone: student.parentPhone || "",
        email: student.email || "",
        address: student.address || "",
        healthNote: student.healthNote || "",
    });

    const [permissions, setPermissions] = useState<Record<string, string>>(
        student.user?.permissions || {}
    );

    const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

    const handleFieldChange = (field: string, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const handleTitleChange = (newTitle: string) => {
        setFormState((prev) => ({ ...prev, title: newTitle }));
    };

    const handlePermissionChange = (field: string, value: string) => {
        setPermissions((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append("id", student.id);

                // Đẩy toàn bộ trường từ StudentFormCore
                Object.entries(formState).forEach(([key, val]) => {
                    formData.append(key, val);
                });

                // Đẩy từng quyền chi tiết của CoachPermission
                Object.entries(permissions).forEach(([permKey, permVal]) => {
                    formData.append(permKey, permVal);
                });

                await updateStudent(student.id, formData);

                setMsg("Đã lưu thay đổi hồ sơ và cập nhật phân quyền!");
                setTimeout(() => {
                    setMsg(null);
                    onClose?.();
                }, 1500);
            } catch (err: unknown) {
                alert(err instanceof Error ? err.message : "Lỗi cập nhật hồ sơ");
            }
        });
    };

    const birthYear = student.dateOfBirth
        ? new Date(student.dateOfBirth).getFullYear().toString()
        : "2000";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Form nhập liệu cốt lõi */}
            <StudentFormCore
                formData={formState}
                onChange={handleFieldChange}
                readOnlyCode={true}
            />

            {/* 2. Cài đặt chức vị & Phân quyền Huấn luyện viên */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <CoachPermissionSettings
                    title={formState.title || "MEMBER"}
                    onTitleChange={handleTitleChange}
                    permissions={permissions}
                    onPermissionChange={handlePermissionChange}
                    isSuperAdmin={isSuperAdmin}
                />
            </div>

            {/* 3. Khối hiển thị tài khoản đối soát cho SUPER_ADMIN */}
            {isSuperAdmin && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Tài khoản hệ thống
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                            Mật khẩu mặc định: Năm sinh (YYYY)
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                            <span className="text-slate-500 block mb-0.5">Tên đăng nhập (Username):</span>
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 block select-all">
                                {student.user?.username ||
                                    `${student.fullName.trim().toLowerCase().replace(/\s+/g, "")}${(student.studentCode || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block mb-0.5">Mật khẩu khởi tạo:</span>
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 block">
                                {birthYear} (Năm sinh)
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Nhóm nút thao tác */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                        Đóng
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                    {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                {msg && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-2">{msg}</span>}
            </div>
        </form>
    );
}
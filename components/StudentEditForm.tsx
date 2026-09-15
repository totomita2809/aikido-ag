"use client";

import React, { useState, useTransition } from "react";
import StudentFormCore from "@/components/StudentFormCore";
import CoachPermissionSettings from "@/components/CoachPermissionSettings";
import { updateStudent } from "@/app/actions/student";
import { ArrowRight, Check, X, AlertTriangle } from "lucide-react";

export interface StudentEditPayload {
    id: string;
    studentCode: string;
    fullName: string;
    avatar?: string | null;
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

interface ChangeItem {
    label: string;
    oldVal: string;
    newVal: string;
}

const FIELD_LABELS: Record<string, string> = {
    fullName: "Họ và tên",
    studentCode: "Mã môn sinh",
    currentRank: "Cấp đai",
    dojo: "Sân tập trực thuộc",
    dateOfBirth: "Ngày sinh",
    gender: "Giới tính",
    phone: "Số điện thoại",
    parentPhone: "Số điện thoại phụ huynh",
    email: "Địa chỉ Email",
    status: "Trạng thái tập luyện",
    title: "Chức vụ võ đường",
    address: "Địa chỉ cư trú",
    healthNote: "Lưu ý sức khỏe",
};

export default function StudentEditForm({ student, currentUserRole, onClose }: StudentEditFormProps) {
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<string | null>(null);

    // Modal xác nhận chi tiết dành riêng cho HLV Trưởng
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [detectedChanges, setDetectedChanges] = useState<ChangeItem[]>([]);

    const [formState, setFormState] = useState<Record<string, string>>({
        studentCode: student.studentCode || "",
        fullName: student.fullName || "",
        avatar: student.avatar || "",
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

    // Hàm đối soát các mục thay đổi so với hồ sơ gốc
    const computeChanges = (): ChangeItem[] => {
        const changes: ChangeItem[] = [];

        Object.entries(formState).forEach(([key, newVal]) => {
            if (key === "avatar") return; // Không hiển thị base64 ảnh dài dòng
            const oldValRaw = (student as unknown as Record<string, unknown>)[key];
            let oldVal = "";
            if (oldValRaw instanceof Date) {
                oldVal = oldValRaw.toISOString().split("T")[0];
            } else {
                oldVal = String(oldValRaw ?? "");
            }

            if (oldVal.trim() !== newVal.trim()) {
                changes.push({
                    label: FIELD_LABELS[key] || key,
                    oldVal: oldVal || "Trống",
                    newVal: newVal || "Trống",
                });
            }
        });

        // Kiểm tra phân quyền HLV nếu là SHIDOIN
        if (formState.title === "SHIDOIN") {
            const oldPerms = student.user?.permissions || {};
            Object.entries(permissions).forEach(([permKey, permVal]) => {
                const oldP = oldPerms[permKey] || "VIEW";
                if (oldP !== permVal) {
                    changes.push({
                        label: `Quyền: ${permKey}`,
                        oldVal: oldP === "EDIT" ? "Sửa" : "Xem",
                        newVal: permVal === "EDIT" ? "Sửa" : "Xem",
                    });
                }
            });
        }

        return changes;
    };

    // Hành động gửi formData thực tế lên server
    const executeSubmit = () => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append("id", student.id);

                Object.entries(formState).forEach(([key, val]) => {
                    formData.append(key, val);
                });

                Object.entries(permissions).forEach(([permKey, permVal]) => {
                    formData.append(permKey, permVal);
                });

                const res = await updateStudent(student.id, formData);

                const result = res as { success?: boolean; noChange?: boolean; message?: string };
                if (result?.noChange) {
                    alert(result.message || "Dữ liệu không có thay đổi nào so với hồ sơ hiện tại.");
                    setShowConfirmModal(false);
                    return;
                }

                setShowConfirmModal(false);
                setMsg(
                    isSuperAdmin
                        ? "HLV Trưởng đã cập nhật trực tiếp dữ liệu thành công!"
                        : "Đã gửi yêu cầu chỉnh sửa đến HLV Trưởng xét duyệt!"
                );
                setTimeout(() => {
                    setMsg(null);
                    onClose?.();
                }, 1500);
            } catch (err: unknown) {
                alert(err instanceof Error ? err.message : "Lỗi cập nhật hồ sơ");
            }
        });
    };

    const handleFormSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();

        // Kiểm tra các trường có thực sự thay đổi không (Chống spam)
        const changes = computeChanges();
        if (changes.length === 0 && (student.avatar || "") === formState.avatar) {
            alert("Dữ liệu không có thay đổi nào so với hồ sơ hiện tại trên hệ thống.");
            return;
        }

        // Nếu là SUPER_ADMIN -> Bật bảng chi tiết đối soát để kiểm tra trước khi xác nhận cập nhật DB
        if (isSuperAdmin) {
            setDetectedChanges(changes);
            setShowConfirmModal(true);
            return;
        }

        // Nếu là COACH -> Gửi yêu cầu duyệt như bình thường
        executeSubmit();
    };

    const birthYear = student.dateOfBirth
        ? new Date(student.dateOfBirth).getFullYear().toString()
        : "2000";

    return (
        <>
            <form onSubmit={handleFormSubmit} className="space-y-5">
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
                        {isPending ? "Đang xử lý..." : isSuperAdmin ? "Kiểm tra & Lưu vào DB" : "Gửi yêu cầu sửa đổi"}
                    </button>
                    {msg && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-2">{msg}</span>}
                </div>
            </form>

            {/* MODAL ĐỐI SOÁT & XÁC NHẬN CỦA HLV TRƯỞNG TRƯỚC KHI GHI VÀO DB */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <span>Xác nhận cập nhật trực tiếp Database</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            HLV Trưởng vui lòng đối soát các mục thay đổi dưới đây trước khi ghi nhận chính thức vào cơ sở dữ liệu:
                        </p>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs max-h-60 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                                    <tr>
                                        <th className="p-2.5">Trường dữ liệu</th>
                                        <th className="p-2.5">Giá trị cũ</th>
                                        <th className="p-2.5 text-red-600">Giá trị mới</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {detectedChanges.map((c, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">{c.label}</td>
                                            <td className="p-2.5 text-slate-400 line-through">{c.oldVal}</td>
                                            <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
                                                <span>{c.newVal}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {student.avatar !== formState.avatar && formState.avatar && (
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">Ảnh đại diện</td>
                                            <td className="p-2.5 text-slate-400">Ảnh cũ</td>
                                            <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">Cập nhật ảnh mới</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                            >
                                Kiểm tra lại
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={executeSubmit}
                                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                <span>{isPending ? "Đang ghi vào DB..." : "Xác nhận & Lưu vào DB"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
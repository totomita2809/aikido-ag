"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, HeartPulse } from "lucide-react";
import { updateStudent } from "@/app/actions/student";
import CoachPermissionSettings from "@/components/CoachPermissionSettings";
import DatePickerVN from "@/components/common/DatePickerVN";

interface Props {
    student: {
        id: string;
        studentCode: string;
        fullName: string;
        currentRank: string;
        dojo: string;
        email?: string | null;
        healthNote?: string | null;
        dateOfBirth: Date | null;
        gender: string | null;
        phone: string | null;
        address: string | null;
        status: string;
        title?: string;
        joinDate?: Date | null;
    };
}

export default function StudentEditForm({ student }: Props) {
    const [selectedDojo, setSelectedDojo] = useState(student.dojo || "HAYATE");
    const [title, setTitle] = useState(student.title || "MEMBER");
    const [isDirty, setIsDirty] = useState(false);

    // Format ngày có sẵn từ DB sang dd/MM/yyyy để truyền vào DatePickerVN
    const formatToVNDate = (d: Date | null | undefined) => {
        if (!d) return "";
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return "";
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const [dateOfBirth, setDateOfBirth] = useState(formatToVNDate(student.dateOfBirth));
    const [joinDate, setJoinDate] = useState(formatToVNDate(student.joinDate));

    // Tách phần số cố định phía sau (ví dụ: HYT-002 => 002)
    const match = student.studentCode ? student.studentCode.match(/\d+$/) : null;
    const suffix = match ? match[0] : student.studentCode.replace(/^(HYT-|TC-)/, "");

    // Tiền tố tự động nhảy theo sân đã chọn
    const currentPrefix = selectedDojo === "TACHI" ? "TC-" : "HYT-";
    const computedStudentCode = `${currentPrefix}${suffix}`;

    // Cảnh báo khi người dùng reload hoặc tắt trang mà chưa lưu dữ liệu
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isDirty]);

    const handleDojoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDojo(e.target.value);
        setIsDirty(true);
    };

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        setIsDirty(true);
    };

    const updateStudentWithId = updateStudent.bind(null, student.id);

    return (
        <form
            action={updateStudentWithId}
            onSubmit={() => setIsDirty(false)}
            onChange={() => setIsDirty(true)}
            className="mt-6 space-y-5"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chuyển sân tập chính & Tự đổi tiền tố mã */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Sân tập chính trực thuộc
                    </label>
                    <select
                        name="dojo"
                        value={selectedDojo}
                        onChange={handleDojoChange}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="HAYATE">Aikido Hayate (Học phí 300k/tháng)</option>
                        <option value="TACHI">Sân Tachi (Học phí 600k/quý)</option>
                    </select>
                </div>

                {/* Mã môn sinh cố định, bị mờ, chỉ tự đổi tiền tố theo sân */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Mã môn sinh (Cố định theo sân)
                    </label>
                    <div className="flex items-center">
                        <span className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-lg text-sm font-mono font-bold text-red-600 dark:text-red-400 select-none">
                            {currentPrefix}
                        </span>
                        <input
                            type="text"
                            value={suffix}
                            readOnly
                            disabled
                            tabIndex={-1}
                            className="w-full px-3.5 py-2 font-mono font-bold rounded-r-lg border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed opacity-60 select-none focus:outline-none"
                        />
                    </div>
                    {/* Input hidden gửi mã đầy đủ lên Server */}
                    <input type="hidden" name="studentCode" value={computedStudentCode} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        defaultValue={student.fullName}
                        required
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Cấp đai
                    </label>
                    <select
                        name="currentRank"
                        defaultValue={student.currentRank}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <optgroup label="1. Nhập môn">
                            <option value="Đai trắng trơn">Đai trắng</option>
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
                            <option value="Đai đen (Shodan)">Đai đen (Shodan - 1 Dan)</option>
                            <option value="Đai đen (Nidan)">Đai đen (Nidan - 2 Dan)</option>
                            <option value="Đai đen (Sandan)">Đai đen (Sandan - 3 Dan)</option>
                        </optgroup>
                    </select>
                </div>

                {/* Ngày sinh chuẩn dd/MM/yyyy */}
                <DatePickerVN
                    name="dateOfBirth"
                    label="Ngày sinh"
                    value={dateOfBirth}
                    onChange={(val) => {
                        setDateOfBirth(val);
                        setIsDirty(true);
                    }}
                />

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Giới tính
                    </label>
                    <select
                        name="gender"
                        defaultValue={student.gender || "Nam"}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Số điện thoại
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        defaultValue={student.phone || ""}
                        placeholder="09xxxxxxxx"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Địa chỉ Email (Không bắt buộc)
                    </label>
                    <input
                        type="email"
                        name="email"
                        defaultValue={student.email || ""}
                        placeholder="example@gmail.com"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                {/* Ngày nhập môn chuẩn dd/MM/yyyy */}
                <DatePickerVN
                    name="joinDate"
                    label="Ngày nhập môn"
                    value={joinDate}
                    onChange={(val) => {
                        setJoinDate(val);
                        setIsDirty(true);
                    }}
                />

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Trạng thái tập luyện
                    </label>
                    <select
                        name="status"
                        defaultValue={student.status}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="ACTIVE">Đang tập luyện</option>
                        <option value="PAUSED">Tạm nghỉ</option>
                        <option value="INACTIVE">Đã dừng tập</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Địa chỉ thường trú
                </label>
                <input
                    type="text"
                    name="address"
                    defaultValue={student.address || ""}
                    placeholder="Địa chỉ cư trú hiện tại"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
            </div>

            {/* Chọn chức vị & Bảng cấp quyền thao tác */}
            <CoachPermissionSettings
                title={title}
                onTitleChange={handleTitleChange}
                isSuperAdmin={true}
            />

            {/* Sức khỏe & Bệnh lý */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                <label className="flex items-center space-x-2 text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1.5">
                    <HeartPulse className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Tình trạng sức khỏe & Tiền sử bệnh lý (HLV theo dõi)</span>
                </label>
                <textarea
                    name="healthNote"
                    defaultValue={student.healthNote || ""}
                    rows={2}
                    placeholder="Ghi rõ: tim mạch, huyết áp, hen suyễn, đau lưng, khớp gối, cổ tay... để HLV điều chỉnh kỹ thuật té ngã."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-amber-300 dark:border-amber-800/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                    href="/"
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    Hủy
                </Link>
                <button
                    type="submit"
                    className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    <span>Cập nhật</span>
                </button>
            </div>
        </form>
    );
}
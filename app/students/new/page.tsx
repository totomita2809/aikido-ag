"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    UserPlus,
    HeartPulse,
    Trash2,
    Check,
    AlertCircle,
    Eye,
    Loader2,
    Pencil,
    Camera,
    Upload,
    X,
    Lock,
} from "lucide-react";
import { createStudent, getNextStudentCode } from "@/app/actions/student";
import CoachPermissionSettings from "@/components/CoachPermissionSettings";
import DatePickerVN from "@/components/common/DatePickerVN";

interface TempStudentItem {
    id: string;
    formData: FormData;
    display: {
        fullName: string;
        studentCode: string;
        dojo: string;
        currentRank: string;
        title: string;
        avatar?: string;
        dateOfBirth?: string;
        gender?: string;
        phone?: string;
        parentPhone?: string;
        email?: string;
        joinDate?: string;
        address?: string;
        healthNote?: string;
    };
}

export default function NewStudentPage() {
    const router = useRouter();

    const getTodayFormatted = () => {
        const today = new Date();
        const d = String(today.getDate()).padStart(2, "0");
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const y = today.getFullYear();
        return `${d}/${m}/${y}`;
    };

    // Form inputs state
    const [avatar, setAvatar] = useState("");
    const [selectedDojo, setSelectedDojo] = useState("HAYATE");
    const [studentCode, setStudentCode] = useState("");
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [fullName, setFullName] = useState("");
    const [currentRank, setCurrentRank] = useState("Đai trắng");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [gender, setGender] = useState("Nam");
    const [phone, setPhone] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [email, setEmail] = useState("");
    const [joinDate, setJoinDate] = useState(getTodayFormatted);
    const [address, setAddress] = useState("");
    const [healthNote, setHealthNote] = useState("");
    const [title, setTitle] = useState("MEMBER");

    // Quản lý danh sách lưu tạm & Modal
    const [tempList, setTempList] = useState<TempStudentItem[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Cảnh báo khi người dùng reload hoặc thoát trang mà chưa lưu dữ liệu
    const hasUnsavedData = tempList.length > 0 || fullName.trim().length > 0;
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!hasUnsavedData || saveSuccess) return;
            e.preventDefault();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedData, saveSuccess]);

    // Tự động kiểm tra database và danh sách lưu tạm để lấy số thứ tự lớn nhất toàn hệ thống (không trùng giữa các sân và HLV)
    const updateAutoCode = async (prefix: string, currentTemps: TempStudentItem[]) => {
        setIsGeneratingCode(true);
        try {
            const nextCodeFromDb = await getNextStudentCode(prefix);
            let maxNum = 0;
            const matchDb = nextCodeFromDb.match(/\d+$/);
            if (matchDb && matchDb[0]) {
                maxNum = parseInt(matchDb[0], 10);
            }

            // Quét tất cả các số thứ tự trong danh sách lưu tạm (không phân biệt tiền tố)
            for (const item of currentTemps) {
                const matchTemp = item.display.studentCode.match(/\d+$/);
                if (matchTemp && matchTemp[0]) {
                    const num = parseInt(matchTemp[0], 10);
                    if (!isNaN(num) && num >= maxNum) {
                        maxNum = num + 1;
                    }
                }
            }

            setStudentCode(`${prefix}-${String(maxNum).padStart(3, "0")}`);
        } catch (err: unknown) {
            console.error("Lỗi tự động cấp mã môn sinh:", err);
        } finally {
            setIsGeneratingCode(false);
        }
    };

    // Tự động cấp mã khi mở trang lần đầu
    useEffect(() => {
        let isMounted = true;
        const initCode = async () => {
            try {
                const nextCodeFromDb = await getNextStudentCode("HYT");
                if (isMounted) {
                    setStudentCode(nextCodeFromDb);
                }
            } catch (err: unknown) {
                console.error("Lỗi tự động cấp mã môn sinh khởi tạo:", err);
            }
        };

        void initCode();

        return () => {
            isMounted = false;
        };
    }, []);

    // Xử lý nạp ảnh thẻ và chuyển đổi sang Data URL
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Dung lượng ảnh tối đa là 2MB. Vui lòng chọn ảnh nhẹ hơn!");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                setAvatar(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    // Đổi sân: giữ nguyên số thứ tự toàn hệ thống và đổi tiền tố
    const handleDojoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDojo = e.target.value;
        setSelectedDojo(newDojo);

        if (title === "SHIDOIN") {
            updateAutoCode("HLV", tempList);
        } else if (newDojo === "TACHI") {
            updateAutoCode("TC", tempList);
        } else {
            updateAutoCode("HYT", tempList);
        }
    };

    // Đổi chức vụ: Tự động set cả 2 sân và tiền tố HLV- khi là Shidoin
    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);

        if (newTitle === "SHIDOIN") {
            setSelectedDojo("BOTH");
            updateAutoCode("HLV", tempList);
        } else {
            const fallbackDojo = selectedDojo === "BOTH" ? "HAYATE" : selectedDojo;
            setSelectedDojo(fallbackDojo);
            updateAutoCode(fallbackDojo === "TACHI" ? "TC" : "HYT", tempList);
        }
    };

    const getDojoLabel = (dojoKey: string) => {
        if (dojoKey === "BOTH") return "Cả 2 sân (Aikido Hayate & Aikido Tachi)";
        if (dojoKey === "TACHI") return "Aikido Tachi (TC)";
        return "Aikido Hayate (HYT)";
    };

    // Xử lý nút "Lưu tạm"
    const handleAddTemp = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !studentCode.trim()) return;

        const actualDojo = title === "SHIDOIN" ? "BOTH" : selectedDojo;

        const formData = new FormData();
        if (avatar) formData.append("avatar", avatar);
        formData.append("dojo", actualDojo);
        formData.append("studentCode", studentCode.trim());
        formData.append("fullName", fullName.trim());
        formData.append("currentRank", currentRank);
        if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
        formData.append("gender", gender);
        if (phone.trim()) formData.append("phone", phone.trim());
        if (parentPhone.trim()) formData.append("parentPhone", parentPhone.trim());
        if (email.trim()) formData.append("email", email.trim());
        if (joinDate) formData.append("joinDate", joinDate);
        if (address.trim()) formData.append("address", address.trim());
        if (healthNote.trim()) formData.append("healthNote", healthNote.trim());
        formData.append("title", title);

        const newItem: TempStudentItem = {
            id: Date.now().toString(),
            formData,
            display: {
                fullName: fullName.trim(),
                studentCode: studentCode.trim(),
                dojo: getDojoLabel(actualDojo),
                currentRank,
                title,
                avatar: avatar || undefined,
                dateOfBirth,
                gender,
                phone,
                parentPhone,
                email,
                joinDate,
                address,
                healthNote,
            },
        };

        const updatedTempList = [...tempList, newItem];
        setTempList(updatedTempList);

        // Reset toàn bộ thông tin form về mặc định sạch sẽ cho môn sinh kế tiếp
        setAvatar("");
        setFullName("");
        setSelectedDojo("HAYATE");
        setCurrentRank("Đai trắng");
        setDateOfBirth("");
        setGender("Nam");
        setPhone("");
        setParentPhone("");
        setEmail("");
        setAddress("");
        setHealthNote("");
        setTitle("MEMBER");
        setJoinDate(getTodayFormatted());

        // Cấp mã số thứ tự tiếp theo trên toàn hệ thống cho lượt nhập kế tiếp
        updateAutoCode("HYT", updatedTempList);
    };

    // Xóa môn sinh khỏi danh sách tạm
    const handleRemoveTemp = (id: string) => {
        setTempList((prev) => prev.filter((item) => item.id !== id));
    };

    // Đưa môn sinh từ danh sách tạm ngược trở lại form để sửa
    const handleEditTemp = (item: TempStudentItem) => {
        const isShidoin = item.display.title === "SHIDOIN";
        let dojoVal = "HAYATE";
        if (isShidoin || item.display.dojo.includes("Cả 2 sân")) {
            dojoVal = "BOTH";
        } else if (item.display.dojo.includes("TC") || item.display.dojo.includes("Tachi")) {
            dojoVal = "TACHI";
        }

        setAvatar(item.display.avatar || "");
        setSelectedDojo(dojoVal);
        setStudentCode(item.display.studentCode);
        setFullName(item.display.fullName);
        setCurrentRank(item.display.currentRank);
        setDateOfBirth(item.display.dateOfBirth || "");
        setGender(item.display.gender || "Nam");
        setPhone(item.display.phone || "");
        setParentPhone(item.display.parentPhone || "");
        setEmail(item.display.email || "");
        setJoinDate(item.display.joinDate || getTodayFormatted());
        setAddress(item.display.address || "");
        setHealthNote(item.display.healthNote || "");
        setTitle(item.display.title || "MEMBER");

        handleRemoveTemp(item.id);
        setShowConfirmModal(false);
    };

    // Lưu tất cả môn sinh vào DB và chuyển về trang quản lý
    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            for (const item of tempList) {
                await createStudent(item.formData);
            }
            setSaveSuccess(true);
            setTimeout(() => {
                router.push("/students");
                router.refresh();
            }, 1500);
        } catch (error: unknown) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Có lỗi xảy ra trong quá trình lưu môn sinh. Vui lòng thử lại!";
            setIsSaving(false);
            setShowConfirmModal(false);
            alert(message);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    href="/students"
                    className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại danh sách</span>
                </Link>

                {tempList.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowConfirmModal(true)}
                        className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Cập nhật dữ liệu ({tempList.length})</span>
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
                <div className="flex items-center space-x-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            Thêm Môn Sinh Mới
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Nhập thông tin môn sinh (định dạng ngày: dd/MM/yyyy)
                        </p>
                    </div>
                </div>

                <form onSubmit={handleAddTemp} className="mt-6 space-y-4">
                    {/* Khối Ảnh thẻ môn sinh */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt="Ảnh thẻ" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
                                    <Camera className="w-8 h-8 stroke-[1.5]" />
                                    <span className="text-[10px] mt-1 font-medium">Ảnh thẻ</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5 text-center sm:text-left flex-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                Ảnh thẻ môn sinh (Chân dung / Võ phục)
                            </label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Hỗ trợ định dạng JPG, PNG hoặc WebP. Dung lượng khuyến nghị dưới 2MB.
                            </p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                                <label className="cursor-pointer px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-xs">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Chọn ảnh</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                                {avatar && (
                                    <button
                                        type="button"
                                        onClick={() => setAvatar("")}
                                        className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-medium transition-colors cursor-pointer inline-flex items-center space-x-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Xóa ảnh</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Sân tập trực thuộc <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="dojo"
                                value={selectedDojo}
                                onChange={handleDojoChange}
                                disabled={title === "SHIDOIN"}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                            >
                                {title === "SHIDOIN" ? (
                                    <option value="BOTH">Cả 2 sân (Aikido Hayate & Aikido Tachi)</option>
                                ) : (
                                    <>
                                        <option value="HAYATE">Aikido Hayate (Mã: HYT-)</option>
                                        <option value="TACHI">Aikido Tachi (Mã: TC-)</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center space-x-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                <span>Mã môn sinh</span>
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] font-normal text-slate-400">(Cấp tự động)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="studentCode"
                                    readOnly
                                    required
                                    value={studentCode}
                                    placeholder={isGeneratingCode ? "Đang cấp mã..." : "Hệ thống tự cấp mã"}
                                    className="w-full px-3.5 py-2 font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-sm focus:outline-none cursor-not-allowed select-none"
                                />
                                {isGeneratingCode && (
                                    <div className="absolute right-3 top-2.5">
                                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="VD: Nguyễn Văn A"
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Cấp đai ban đầu
                            </label>
                            <select
                                name="currentRank"
                                value={currentRank}
                                onChange={(e) => setCurrentRank(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <optgroup label="1. Nhập môn">
                                    <option value="Đai trắng">Đai trắng</option>
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
                                    <option value="Đai đen 4 Đẳng (Yondan)">Đai đen (Yondan - 4 Dan)</option>
                                </optgroup>
                            </select>
                        </div>

                        <DatePickerVN
                            name="dateOfBirth"
                            label="Ngày sinh"
                            value={dateOfBirth}
                            onChange={setDateOfBirth}
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Giới tính
                            </label>
                            <select
                                name="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Số điện thoại cá nhân
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="09xxxxxxxx"
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Số điện thoại phụ huynh
                            </label>
                            <input
                                type="tel"
                                name="parentPhone"
                                value={parentPhone}
                                onChange={(e) => setParentPhone(e.target.value)}
                                placeholder="09xxxxxxxx"
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Email (Không bắt buộc)
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@gmail.com"
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <DatePickerVN
                            name="joinDate"
                            label="Ngày nhập môn"
                            value={joinDate}
                            onChange={setJoinDate}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Địa chỉ thường trú
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Địa chỉ cư trú hiện tại"
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <CoachPermissionSettings
                        title={title}
                        onTitleChange={handleTitleChange}
                        isSuperAdmin={true}
                    />

                    <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                        <label className="flex items-center space-x-2 text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1.5">
                            <HeartPulse className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>Tình trạng sức khỏe & Tiền sử bệnh lý (Lưu ý cho HLV)</span>
                        </label>
                        <textarea
                            name="healthNote"
                            value={healthNote}
                            onChange={(e) => setHealthNote(e.target.value)}
                            rows={2}
                            placeholder="Ghi rõ nếu có: hen suyễn, bệnh tim mạch, huyết áp, thoái hóa khớp, chấn thương cũ... để giáo viên chuẩn bị bài tập và kỹ thuật té ngã an toàn."
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-amber-300 dark:border-amber-800/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link
                            href="/students"
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Hủy
                        </Link>
                        <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
                        >
                            Lưu tạm
                        </button>
                    </div>
                </form>

                {tempList.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Danh sách môn sinh chờ cập nhật ({tempList.length})
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(true)}
                                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                                Xem lại & Cập nhật
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                            {tempList.map((item, idx) => (
                                <div key={item.id} className="p-3 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-500">
                                            {item.display.avatar ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.display.avatar} alt={item.display.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                item.display.fullName.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {idx + 1}. {item.display.fullName}
                                            </span>{" "}
                                            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                                                ({item.display.studentCode})
                                            </span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {item.display.dojo} • {item.display.currentRank} • Chức vụ: {item.display.title}
                                                {item.display.parentPhone ? ` • SĐT PH: ${item.display.parentPhone}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => handleEditTemp(item)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                            title="Sửa môn sinh này"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTemp(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                            title="Xóa khỏi danh sách tạm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Xem lại thông tin trước khi Cập nhật dữ liệu */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-lg">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <span>Xem lại danh sách trước khi lưu</span>
                        </div>

                        {saveSuccess ? (
                            <div className="py-8 text-center space-y-2">
                                <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mb-2">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-base">Đã lưu thành công!</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Đang chuyển về danh sách môn sinh...</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Hệ thống sẽ thêm chính thức <strong>{tempList.length}</strong> môn sinh sau vào cơ sở dữ liệu:
                                </p>

                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg p-2 text-sm">
                                    {tempList.map((item, idx) => (
                                        <div key={item.id} className="py-2 px-1 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-500">
                                                    {item.display.avatar ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.display.avatar} alt={item.display.fullName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        item.display.fullName.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {idx + 1}. {item.display.fullName}
                                                    </span>
                                                    <span className="ml-2 font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                        {item.display.studentCode}
                                                    </span>
                                                    <p className="text-xs text-slate-400">
                                                        {item.display.dojo} • {item.display.currentRank}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleEditTemp(item)}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                <span>Sửa</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => setShowConfirmModal(false)}
                                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Đóng & Sửa tiếp
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={handleSaveAll}
                                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Đang lưu...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Xác nhận</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
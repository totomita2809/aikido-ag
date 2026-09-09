"use client";

import { useState, useRef } from "react";
import { Calendar as CalendarIcon } from "lucide-react";

interface DatePickerVNProps {
    name: string;
    value?: string; // dd/MM/yyyy hoặc ISO string
    onChange?: (val: string) => void;
    label: string;
    required?: boolean;
}

// Chuyển yyyy-mm-dd sang dd/MM/yyyy
function isoToVN(isoStr: string) {
    if (!isoStr) return "";
    const parts = isoStr.split("T")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
}

// Chuyển dd/MM/yyyy sang yyyy-mm-dd
function vnToIso(vnStr: string) {
    if (!vnStr) return "";
    const parts = vnStr.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return "";
}

export default function DatePickerVN({ name, value = "", onChange, label, required = false }: DatePickerVNProps) {
    const formattedInitialValue = value.includes("-") ? isoToVN(value) : value;

    // Quản lý state và tự động đồng bộ khi prop value từ ngoài thay đổi mà không cần useEffect
    const [prevValue, setPrevValue] = useState(value);
    const [displayVal, setDisplayVal] = useState(formattedInitialValue);

    if (value !== prevValue) {
        setPrevValue(value);
        setDisplayVal(value.includes("-") ? isoToVN(value) : value);
    }

    const hiddenDateInputRef = useRef<HTMLInputElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let text = e.target.value.replace(/\D/g, ""); // Chỉ lấy số
        if (text.length > 8) text = text.slice(0, 8); // Tối đa 8 số (2 ngày, 2 tháng, 4 năm)

        let formatted = text;
        if (text.length >= 3 && text.length <= 4) {
            formatted = `${text.slice(0, 2)}/${text.slice(2)}`;
        } else if (text.length >= 5) {
            formatted = `${text.slice(0, 2)}/${text.slice(2, 4)}/${text.slice(4)}`;
        }

        setDisplayVal(formatted);
        if (onChange) onChange(formatted);
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value;
        const vn = isoToVN(iso);
        setDisplayVal(vn);
        if (onChange) onChange(vn);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative flex items-center">
                <input
                    type="text"
                    name={name}
                    value={displayVal}
                    onChange={handleTextChange}
                    placeholder="dd/MM/yyyy"
                    maxLength={10}
                    required={required}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono tracking-wider"
                />

                {/* Nút bấm mở lịch ngầm */}
                <button
                    type="button"
                    onClick={() => hiddenDateInputRef.current?.showPicker?.()}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Mở lịch chọn"
                >
                    <CalendarIcon className="w-4 h-4" />
                </button>

                <input
                    ref={hiddenDateInputRef}
                    type="date"
                    tabIndex={-1}
                    value={vnToIso(displayVal)}
                    onChange={handlePickerChange}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                />
            </div>
        </div>
    );
}
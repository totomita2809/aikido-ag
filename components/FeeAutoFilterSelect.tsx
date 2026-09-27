"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DOJO_CONFIGS } from "@/lib/constants";

interface FeeAutoFilterSelectProps {
    selectedDojo: string;
    currentMonth: number;
    currentYear: number;
}

export default function FeeAutoFilterSelect({
    selectedDojo,
    currentMonth,
    currentYear,
}: FeeAutoFilterSelectProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Tự động sinh danh sách năm: Từ năm hệ thống khởi chạy (2025) đến (Năm hiện tại + 1)
    // Tự mở rộng theo thời gian mà không cần can thiệp code thủ công
    const availableYears = useMemo(() => {
        const startYear = 2025;
        const nowYear = new Date().getFullYear();
        const maxYear = Math.max(nowYear + 1, currentYear);
        const years: number[] = [];
        for (let y = startYear; y <= maxYear; y++) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    const handleFilterChange = (key: string, val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, val);
        router.push(`/fees?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* 1. Lọc theo sân tập kèm học phí niêm yết */}
            <select
                value={selectedDojo}
                onChange={(e) => handleFilterChange("dojo", e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
                <option value="ALL" className="dark:bg-slate-900">
                    Tất cả sân
                </option>
                <option value={DOJO_CONFIGS.HAYATE.key} className="dark:bg-slate-900">
                    {DOJO_CONFIGS.HAYATE.name} ({DOJO_CONFIGS.HAYATE.feeAmount / 1000}k/tháng)
                </option>
                <option value={DOJO_CONFIGS.TACHI.key} className="dark:bg-slate-900">
                    {DOJO_CONFIGS.TACHI.name} ({DOJO_CONFIGS.TACHI.feeAmount / 1000}k/quý)
                </option>
            </select>

            {/* 2. Lọc theo tháng (1 - 12) */}
            <select
                value={currentMonth}
                onChange={(e) => handleFilterChange("month", e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="dark:bg-slate-900">
                        Tháng {m}
                    </option>
                ))}
            </select>

            {/* 3. Lọc theo năm: Tự động mở rộng theo thời gian thực */}
            <select
                value={currentYear}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
                {availableYears.map((y) => (
                    <option key={y} value={y} className="dark:bg-slate-900">
                        Năm {y}
                    </option>
                ))}
            </select>
        </div>
    );
}
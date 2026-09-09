"use client";

import { useTransition } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { exportStudentsCSV, exportTuitionFeesCSV } from "@/app/actions/export";
import { exportToCSV } from "@/lib/exportUtils";

interface Props {
    type?: "STUDENTS" | "FEES";
    dojo?: string;
    year?: number;
}

export default function ExportButton({ type = "STUDENTS", dojo = "ALL", year = new Date().getFullYear() }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleExport = () => {
        startTransition(async () => {
            try {
                if (type === "STUDENTS") {
                    const csvData: string = await exportStudentsCSV(dojo);
                    const filename = `Danh_Sach_Mon_Sinh_${dojo}_${new Date().toISOString().split("T")[0]}`;
                    exportToCSV(csvData, filename);
                } else {
                    const csvData: string = await exportTuitionFeesCSV(year, undefined, dojo);
                    const filename = `So_Thu_Hoc_Phi_Nam_${year}_${dojo}`;
                    exportToCSV(csvData, filename);
                }
            } catch (error) {
                console.error("Lỗi xuất file:", error);
                alert("Đã xảy ra lỗi khi xuất file!");
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={isPending}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{isPending ? "Đang xuất..." : "Xuất Excel"}</span>
        </button>
    );
}
"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export interface DialogConfig {
    isOpen: boolean;
    type: "INFO" | "SUCCESS" | "WARNING" | "CONFIRM";
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    customContent?: React.ReactNode;
}

export default function CustomDialog({
    config,
}: {
    config: DialogConfig;
}) {
    if (!config.isOpen) return null;

    const handleClose = () => {
        if (config.onClose) {
            config.onClose();
        }
    };

    const isConfirm = config.type === "CONFIRM" || config.type === "WARNING";

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                        {config.type === "SUCCESS" && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {config.type === "WARNING" && (
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                        {config.type === "CONFIRM" && (
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                        {config.type === "INFO" && (
                            <Info className="w-5 h-5 text-blue-500 shrink-0" />
                        )}
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {config.title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {config.message}
                    </p>

                    {config.customContent && (
                        <div className="mt-3">{config.customContent}</div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
                    {isConfirm && (
                        <button
                            type="button"
                            onClick={() => {
                                config.onCancel?.();
                                handleClose();
                            }}
                            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                            {config.cancelText || "Hủy bỏ"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            config.onConfirm?.();
                            handleClose();
                        }}
                        className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors cursor-pointer shadow-xs ${config.type === "CONFIRM"
                                ? "bg-red-600 hover:bg-red-700"
                                : config.type === "SUCCESS"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {config.confirmText || "Xác nhận"}
                    </button>
                </div>
            </div>
        </div>
    );
}
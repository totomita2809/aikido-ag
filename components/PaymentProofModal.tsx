"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Loader2 } from "lucide-react";
import { uploadPaymentProof, getPaymentProofs } from "@/app/actions/paymentProof";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    month: number;
    year: number;
}

interface ProofItem {
    id: string;
    imageUrl: string;
    createdAt: string;
}

export default function PaymentProofModal({ isOpen, onClose, studentId, studentName, month, year }: Props) {
    const [proofs, setProofs] = useState<ProofItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let isMounted = true;

        async function loadProofs() {
            if (!isOpen) return;
            setLoading(true);
            try {
                const data = await getPaymentProofs(studentId, month, year);
                if (isMounted) {
                    setProofs(data);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadProofs();

        return () => {
            isMounted = false;
        };
    }, [isOpen, studentId, month, year]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            const img = new Image();
            const resultString = event.target?.result;
            if (typeof resultString !== "string") return;

            img.src = resultString;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                let quality = 0.8;
                let dataUrl = canvas.toDataURL("image/jpeg", quality);

                while (dataUrl.length > 2 * 1024 * 1024 && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL("image/jpeg", quality);
                }

                startTransition(async () => {
                    const res = await uploadPaymentProof(studentId, month, year, dataUrl);
                    if (res.success) {
                        const updated = await getPaymentProofs(studentId, month, year);
                        setProofs(updated);
                    } else {
                        alert(res.message);
                    }
                });
            };
        };
        reader.readAsDataURL(file);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Biên lai chuyển khoản: {studentName}
                        </h3>
                        <p className="text-xs text-slate-500">Tháng {month}/{year}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 cursor-pointer hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-800/40">
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    {isPending ? (
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                    ) : (
                        <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isPending ? "Đang xử lý và nén ảnh..." : "Bấm vào để chọn ảnh hoặc chụp từ điện thoại"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Tự động convert sang JPG và tối ưu dưới 2MB</span>
                </label>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Hình ảnh đã lưu</h4>
                    {loading ? (
                        <p className="text-xs text-center text-slate-400 py-4">Đang tải danh sách ảnh...</p>
                    ) : proofs.length === 0 ? (
                        <p className="text-xs text-center text-slate-400 py-4">Chưa có hình ảnh chuyển khoản nào.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {proofs.map((p) => (
                                <a key={p.id} href={p.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.imageUrl} alt="Biên lai" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">{p.createdAt}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
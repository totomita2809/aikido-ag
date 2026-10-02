"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import {
    Sparkles, X, PlusCircle, Image as ImageIcon, CheckCircle, Clock,
    Archive, Calendar as CalendarIcon, Trash2, AlertTriangle, Edit3, Loader2
} from "lucide-react";
import {
    getCurrentUserRole,
    updateCarouselEventInfo,
    deleteCarouselEvent,
    getUploadPresignedUrls,
    createCarouselEventWithDirectUrls
} from "@/app/actions/carousel";
import { compressImage } from "@/lib/image-compressor";

export interface CarouselEventData {
    id?: string;
    eventKey?: string;
    title: string;
    eventDate: string;
    description?: string;
    horizontalImages: string[];
    verticalImages: string[];
    createdAt?: string;
}

interface ImageUploadItem {
    id: string;
    rawFile: File;
    previewUrl: string;
    aspectRatio: "LANDSCAPE" | "PORTRAIT";
    compressedBlob?: Blob;
    status: "COMPRESSING" | "READY" | "UPLOADING" | "DONE" | "ERROR";
    progress: number;
}

export default function ExamDualCarousel() {
    const [events, setEvents] = useState<CarouselEventData[]>([]);
    const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);
    const [archiveModalOpen, setArchiveModalOpen] = useState(false);

    const [hIndex, setHIndex] = useState(0);
    const [vIndex1, setVIndex1] = useState(0);
    const [vIndex2, setVIndex2] = useState(1);

    const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [pendingActionType, setPendingActionType] = useState<"CREATE" | "UPDATE" | "DELETE">("CREATE");
    const [isPending, startTransition] = useTransition();

    // Tiến trình xử lý
    const [uploadStatusText, setUploadStatusText] = useState("");

    const getTodayVNDateStr = () => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const [formTitle, setFormTitle] = useState("");
    const [formDate, setFormDate] = useState(getTodayVNDateStr());
    const [formDescription, setFormDescription] = useState("");
    const [selectedImages, setSelectedImages] = useState<ImageUploadItem[]>([]);
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

    const datePickerRef = useRef<HTMLInputElement>(null);
    const editDatePickerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getCurrentUserRole()
            .then((role: string | null) => {
                if (role) setUserRole(role);
            })
            .catch(() => { });
    }, []);

    const fetchEvents = () => {
        fetch("/api/exam-photos")
            .then((res) => res.json())
            .then((data: {
                events?: CarouselEventData[];
                latestDate?: string;
                horizontal?: string[];
                vertical?: string[];
            }) => {
                if (data.events && data.events.length > 0) {
                    setEvents(data.events);
                } else {
                    setEvents([
                        {
                            id: "default-1",
                            eventKey: "default-key",
                            title: "KHOẢNH KHẮC KỲ THI THĂNG CẤP ĐAI",
                            eventDate: data.latestDate || "06-09-2026",
                            description: "Những hình ảnh nổi bật ghi nhận sự nỗ lực và tinh thần võ đạo của các môn sinh.",
                            horizontalImages: data.horizontal && data.horizontal.length > 0 ? data.horizontal : ["/banner/banner-1.jpg"],
                            verticalImages: data.vertical && data.vertical.length > 0 ? data.vertical : ["/banner/banner-2.jpg", "/banner/banner-3.jpg"],
                        },
                    ]);
                }
            })
            .catch(() => {
                setEvents([
                    {
                        id: "fallback-1",
                        eventKey: "fallback-key",
                        title: "KHOẢNH KHẮC KỲ THI THĂNG CẤP ĐAI",
                        eventDate: "06-09-2026",
                        description: "Những hình ảnh nổi bật ghi nhận sự nỗ lực và tinh thần võ đạo của các môn sinh.",
                        horizontalImages: ["/banner/banner-1.jpg"],
                        verticalImages: ["/banner/banner-2.jpg", "/banner/banner-3.jpg"],
                    },
                ]);
            });
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isCoach = userRole === "COACH";
    const canManage = isSuperAdmin || isCoach;

    const currentEvent = events[selectedEventIndex] || events[0];
    const recentEvents = events.slice(0, 3);
    const olderEvents = events.slice(3);

    const activeHList = currentEvent?.horizontalImages?.length > 0 ? currentEvent.horizontalImages : ["/banner/banner-1.jpg"];
    const activeVList = currentEvent?.verticalImages?.length > 0 ? currentEvent.verticalImages : ["/banner/banner-2.jpg"];

    const currentHImage = activeHList[hIndex % activeHList.length];
    const currentVImage1 = activeVList[vIndex1 % activeVList.length];
    const currentVImage2 = activeVList[vIndex2 % activeVList.length];

    useEffect(() => {
        if (activeHList.length <= 1) return;
        const timer = setInterval(() => {
            setHIndex((prev) => (prev + 1) % activeHList.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [activeHList.length]);

    useEffect(() => {
        if (activeVList.length <= 1) return;
        const timer = setInterval(() => {
            setVIndex1((prev) => (prev + 1) % activeVList.length);
            setVIndex2((prev) => (prev + 2) % activeVList.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [activeVList.length]);

    const handleDateTextChange = (val: string) => {
        const cleaned = val.replace(/\D/g, "").slice(0, 8);
        let formatted = cleaned;
        if (cleaned.length >= 3 && cleaned.length <= 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        } else if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
        }
        setFormDate(formatted);
    };

    const handleNativeDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateVal = e.target.value;
        if (!dateVal) return;
        const [y, m, d] = dateVal.split("-");
        if (y && m && d) setFormDate(`${d}/${m}/${y}`);
    };

    // Chọn ảnh và nén luân phiên theo lô nhỏ 2 ảnh/lượt
    const handleMultipleImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newItems: ImageUploadItem[] = Array.from(files).map((file, idx) => ({
            id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            rawFile: file,
            previewUrl: URL.createObjectURL(file),
            aspectRatio: "LANDSCAPE",
            status: "COMPRESSING",
            progress: 25,
        }));

        setSelectedImages((prev) => [...prev, ...newItems]);
        e.target.value = "";

        const CHUNK_SIZE = 2;
        for (let i = 0; i < newItems.length; i += CHUNK_SIZE) {
            const chunk = newItems.slice(i, i + CHUNK_SIZE);
            await Promise.all(
                chunk.map(async (item) => {
                    try {
                        const res = await compressImage(item.rawFile, {
                            maxDimension: 2048,
                            quality: 0.85,
                            mimeType: "image/webp",
                        });

                        const byteString = atob(res.base64.split(",")[1]);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let k = 0; k < byteString.length; k++) {
                            ia[k] = byteString.charCodeAt(k);
                        }
                        const blob = new Blob([ab], { type: "image/webp" });

                        setSelectedImages((prev) =>
                            prev.map((it) =>
                                it.id === item.id
                                    ? {
                                        ...it,
                                        aspectRatio: res.aspectRatio,
                                        compressedBlob: blob,
                                        status: "READY",
                                        progress: 100,
                                    }
                                    : it
                            )
                        );
                    } catch {
                        setSelectedImages((prev) =>
                            prev.map((it) => (it.id === item.id ? { ...it, status: "ERROR" } : it))
                        );
                    }
                })
            );
        }
    };

    const handleRemoveImage = (idToRemove: string) => {
        setSelectedImages((prev) => prev.filter((img) => img.id !== idToRemove));
    };

    const handleOpenEditModal = () => {
        if (!currentEvent) return;
        setFormTitle(currentEvent.title);
        setFormDate(currentEvent.eventDate.replace(/-/g, "/"));
        setFormDescription(currentEvent.description || "");
        setIsEditModalOpen(true);
    };

    // Thực thi Server Action (Direct Upload hoặc Edit/Delete)
    const executeAction = () => {
        setConfirmModalOpen(false);

        if (pendingActionType === "CREATE") {
            startTransition(async () => {
                try {
                    setUploadStatusText("1/3: Đang khởi tạo kết nối Cloud R2...");

                    // 1. Xin vé Presigned URLs từ server
                    const presignPayload = selectedImages.map((img) => ({
                        clientTempId: img.id,
                        fileName: img.rawFile.name,
                        aspectRatio: img.aspectRatio,
                    }));

                    const { eventKey, items: presignedList } = await getUploadPresignedUrls(
                        formTitle.trim(),
                        formDate.trim(),
                        presignPayload
                    );

                    // 2. Client bắn trực tiếp lên Cloudflare R2 qua PUT
                    let finishedCount = 0;
                    const totalCount = selectedImages.length;
                    const finalUploadedUrls: { url: string; aspectRatio: "LANDSCAPE" | "PORTRAIT" }[] = [];

                    const CONCURRENCY = 4;
                    for (let i = 0; i < selectedImages.length; i += CONCURRENCY) {
                        const batch = selectedImages.slice(i, i + CONCURRENCY);
                        await Promise.all(
                            batch.map(async (imgItem) => {
                                const target = presignedList.find((p) => p.clientTempId === imgItem.id);
                                if (!target || !imgItem.compressedBlob) return;

                                setSelectedImages((prev) =>
                                    prev.map((it) =>
                                        it.id === imgItem.id ? { ...it, status: "UPLOADING", progress: 65 } : it
                                    )
                                );

                                const uploadRes = await fetch(target.uploadUrl, {
                                    method: "PUT",
                                    headers: { "Content-Type": "image/webp" },
                                    body: imgItem.compressedBlob,
                                });

                                if (!uploadRes.ok) {
                                    throw new Error(`Tải ảnh ${imgItem.rawFile.name} lên Cloudflare R2 thất bại!`);
                                }

                                finishedCount++;
                                setUploadStatusText(`2/3: Đang tải lên R2... (${finishedCount}/${totalCount} ảnh)`);

                                setSelectedImages((prev) =>
                                    prev.map((it) =>
                                        it.id === imgItem.id ? { ...it, status: "DONE", progress: 100 } : it
                                    )
                                );

                                finalUploadedUrls.push({
                                    url: target.publicUrl,
                                    aspectRatio: target.aspectRatio,
                                });
                            })
                        );
                    }

                    // 3. Gửi danh sách URL về Database để lưu
                    setUploadStatusText("3/3: Đang cập nhật cơ sở dữ liệu...");
                    const res = await createCarouselEventWithDirectUrls({
                        title: formTitle.trim(),
                        eventDate: formDate.trim(),
                        description: formDescription.trim() || undefined,
                        eventKey,
                        images: finalUploadedUrls,
                    });

                    setSubmitResult({ success: true, message: res.message });
                    fetchEvents();

                    setTimeout(() => {
                        setIsCreateModalOpen(false);
                        setSubmitResult(null);
                        setUploadStatusText("");
                        setFormTitle("");
                        setFormDate(getTodayVNDateStr());
                        setFormDescription("");
                        setSelectedImages([]);
                    }, 1600);
                } catch (err: unknown) {
                    setUploadStatusText("");
                    alert(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo sự kiện");
                }
            });
            return;
        }

        startTransition(async () => {
            try {
                if (pendingActionType === "UPDATE") {
                    const targetKey = currentEvent?.eventKey || currentEvent?.id || "";
                    const res = await updateCarouselEventInfo(
                        targetKey,
                        formTitle.trim(),
                        formDate.trim(),
                        formDescription.trim() || undefined
                    );
                    alert(res.message);
                    setIsEditModalOpen(false);
                    fetchEvents();
                } else if (pendingActionType === "DELETE") {
                    const targetKey = currentEvent?.eventKey || currentEvent?.id || "";
                    const res = await deleteCarouselEvent(targetKey);
                    alert(res.message);
                    setSelectedEventIndex(0);
                    fetchEvents();
                }
            } catch (err: unknown) {
                alert(err instanceof Error ? err.message : "Đã xảy ra lỗi khi xử lý sự kiện");
            }
        });
    };

    const handleCreateSubmit = () => {
        if (!formTitle.trim()) {
            alert("Vui lòng nhập tiêu đề sự kiện!");
            return;
        }
        if (!formDate.trim() || formDate.length < 10) {
            alert("Vui lòng nhập đúng định dạng ngày dd/MM/yyyy!");
            return;
        }
        if (selectedImages.length === 0) {
            alert("Vui lòng chọn ít nhất một hình ảnh từ thiết bị!");
            return;
        }

        const isStillCompressing = selectedImages.some((img) => img.status === "COMPRESSING");
        if (isStillCompressing) {
            alert("Hệ thống đang hoàn tất tối ưu các ảnh cuối cùng, vui lòng đợi vài giây!");
            return;
        }

        setPendingActionType("CREATE");
        if (isSuperAdmin) {
            setConfirmModalOpen(true);
            return;
        }
        executeAction();
    };

    const handleUpdateSubmit = () => {
        if (!formTitle.trim() || !formDate.trim() || formDate.length < 10) {
            alert("Vui lòng nhập đúng tiêu đề và định dạng ngày dd/MM/yyyy!");
            return;
        }

        setPendingActionType("UPDATE");
        if (isSuperAdmin) {
            setConfirmModalOpen(true);
            return;
        }
        executeAction();
    };

    const handleDeleteClick = () => {
        setPendingActionType("DELETE");
        if (isSuperAdmin) {
            setConfirmModalOpen(true);
            return;
        }
        if (confirm("Gửi yêu cầu xóa sự kiện này tới HLV Trưởng phê duyệt?")) {
            executeAction();
        }
    };

    const groupedOlderEvents = olderEvents.reduce<Record<string, CarouselEventData[]>>((acc, evt) => {
        const parts = evt.eventDate.split(/[-/]/);
        const year = parts.length === 3 ? parts[2] : "Khác";
        if (!acc[year]) acc[year] = [];
        acc[year].push(evt);
        return acc;
    }, {});

    if (!currentEvent) return null;

    return (
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Header: Tiêu đề, Ngày, Mô tả và Cụm Nút Thao tác */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start space-x-3">
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl shrink-0 mt-0.5">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {currentEvent.title} ({currentEvent.eventDate})
                        </h2>
                        {currentEvent.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {currentEvent.description}
                            </p>
                        )}

                        {events.length > 0 && (
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                                <span className="text-[11px] font-semibold text-slate-400">Gần đây:</span>
                                {recentEvents.map((evt, idx) => (
                                    <button
                                        key={evt.id || idx}
                                        type="button"
                                        onClick={() => {
                                            setSelectedEventIndex(idx);
                                            setHIndex(0);
                                            setVIndex1(0);
                                            setVIndex2(1);
                                        }}
                                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${selectedEventIndex === idx
                                                ? "bg-red-600 text-white font-bold shadow-xs"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        {evt.eventDate}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                    {olderEvents.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setArchiveModalOpen(true)}
                            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                            <Archive className="w-4 h-4 text-slate-500" />
                            <span>Lưu trữ ({olderEvents.length})</span>
                        </button>
                    )}

                    {canManage && (
                        <>
                            <button
                                type="button"
                                onClick={handleOpenEditModal}
                                className="inline-flex items-center space-x-1 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                title="Chỉnh sửa tiêu đề và ngày"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Sửa</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                className="inline-flex items-center space-x-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                title="Xóa sự kiện và dọn sạch Cloud R2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Xóa</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setFormDate(getTodayVNDateStr());
                                    setIsCreateModalOpen(true);
                                }}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span>Thêm sự kiện</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Khung ảnh Carousel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Khung 1: Ảnh ngang */}
                <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center p-4">
                    {activeHList.length > 0 ? (
                        <div
                            onClick={() => {
                                if (currentHImage) setActiveLightboxImage(currentHImage);
                            }}
                            className="relative w-full h-full max-w-[92%] max-h-[92%] rounded-2xl overflow-hidden bg-slate-200/50 dark:bg-slate-900/80 border border-slate-300/40 dark:border-slate-700/60 shadow-md cursor-pointer group flex items-center justify-center"
                            title="Bấm để phóng to ảnh"
                        >
                            {activeHList.map((src, idx) => (
                                <div
                                    key={src}
                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${idx === hIndex % activeHList.length ? "opacity-100 z-10" : "opacity-0 z-0"
                                        }`}
                                >
                                    <div className="relative w-full h-full rounded-2xl overflow-hidden">
                                        <Image src={src} alt="Exam Horizontal" fill className="object-cover rounded-2xl" />
                                    </div>
                                </div>
                            ))}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none rounded-2xl z-20" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Đang cập nhật ảnh kỳ thi...
                        </div>
                    )}
                </div>

                {/* Khung 2: 2 Khung ảnh dọc */}
                <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner grid grid-cols-2 gap-4 p-4 items-center justify-items-center">
                    {activeVList.length > 0 ? (
                        <>
                            <div
                                onClick={() => {
                                    if (currentVImage1) setActiveLightboxImage(currentVImage1);
                                }}
                                className="relative w-full h-full max-w-[180px] sm:max-w-[210px] rounded-xl overflow-hidden bg-slate-200/50 dark:bg-slate-900/80 border border-slate-300/40 dark:border-slate-700/60 shadow-md cursor-pointer group flex items-center justify-center p-1"
                                title="Bấm để phóng to ảnh"
                            >
                                {activeVList.map((src, idx) => (
                                    <div
                                        key={src}
                                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${idx === vIndex1 % activeVList.length ? "opacity-100 z-10" : "opacity-0 z-0"
                                            }`}
                                    >
                                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                                            <Image src={src} alt="Exam Vertical 1" fill className="object-cover rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none rounded-xl z-20" />
                            </div>

                            <div
                                onClick={() => {
                                    if (currentVImage2) setActiveLightboxImage(currentVImage2);
                                }}
                                className="relative w-full h-full max-w-[180px] sm:max-w-[210px] rounded-xl overflow-hidden bg-slate-200/50 dark:bg-slate-900/80 border border-slate-300/40 dark:border-slate-700/60 shadow-md cursor-pointer group flex items-center justify-center p-1"
                                title="Bấm để phóng to ảnh"
                            >
                                {activeVList.map((src, idx) => (
                                    <div
                                        key={src}
                                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${idx === vIndex2 % activeVList.length ? "opacity-100 z-10" : "opacity-0 z-0"
                                            }`}
                                    >
                                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                                            <Image src={src} alt="Exam Vertical 2" fill className="object-cover rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none rounded-xl z-20" />
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2 w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Đang cập nhật ảnh kỳ thi...
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Phóng to */}
            {activeLightboxImage && (
                <div
                    onClick={() => setActiveLightboxImage(null)}
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
                >
                    <button
                        type="button"
                        onClick={() => setActiveLightboxImage(null)}
                        className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Close lightbox"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center">
                        <Image src={activeLightboxImage} alt="Exam Enlarged View" fill className="object-contain rounded-xl" sizes="100vw" />
                    </div>
                </div>
            )}

            {/* MODAL SỬA SỰ KIỆN */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-amber-500" />
                                <span>Chỉnh Sửa Sự Kiện</span>
                            </h3>
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            <div className="space-y-1">
                                <label className="font-bold text-slate-700 dark:text-slate-300">Tiêu đề sự kiện (*):</label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-700 dark:text-slate-300">Ngày diễn ra (dd/MM/yyyy) (*):</label>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={formDate}
                                        onChange={(e) => handleDateTextChange(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (editDatePickerRef.current) {
                                                try { editDatePickerRef.current.showPicker(); } catch { editDatePickerRef.current.focus(); }
                                            }
                                        }}
                                        className="absolute right-2.5 p-1 text-slate-400 hover:text-amber-500 transition-colors"
                                    >
                                        <CalendarIcon className="w-4 h-4" />
                                    </button>
                                    <input ref={editDatePickerRef} type="date" onChange={handleNativeDateSelect} className="sr-only" tabIndex={-1} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-700 dark:text-slate-300">Mô tả ngắn:</label>
                                <textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-3.5 py-1.5 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={handleUpdateSubmit}
                                    className="px-4 py-1.5 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                                >
                                    {isPending ? "Đang xử lý..." : isSuperAdmin ? "Lưu thay đổi" : "Gửi yêu cầu sửa"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THÊM SỰ KIỆN */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Thêm Sự Kiện & Tải Hình Ảnh</h3>
                                <span className="text-xs text-slate-400">
                                    {isSuperAdmin ? "Đăng trực tiếp lên website" : "Tạo nội dung và gửi HLV Trưởng duyệt"}
                                </span>
                            </div>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {submitResult ? (
                            <div className="p-6 text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                                    {isSuperAdmin ? <CheckCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                                </div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{submitResult.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5 text-xs">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-700 dark:text-slate-300">Tiêu đề sự kiện (*):</label>
                                    <input
                                        type="text"
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="Ví dụ: KHOẢNH KHẮC KỲ THI THĂNG CẤP ĐAI"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-700 dark:text-slate-300">Ngày diễn ra (dd/MM/yyyy) (*):</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={formDate}
                                            onChange={(e) => handleDateTextChange(e.target.value)}
                                            placeholder="dd/MM/yyyy"
                                            className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (datePickerRef.current) {
                                                    try { datePickerRef.current.showPicker(); } catch { datePickerRef.current.focus(); }
                                                }
                                            }}
                                            className="absolute right-2.5 p-1 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <CalendarIcon className="w-4 h-4" />
                                        </button>
                                        <input ref={datePickerRef} type="date" onChange={handleNativeDateSelect} className="sr-only" tabIndex={-1} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-700 dark:text-slate-300">Mô tả ngắn (nếu có):</label>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        rows={2}
                                        placeholder="Ghi chú thêm về sự kiện..."
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden resize-none"
                                    />
                                </div>

                                {/* Khu vực chọn ảnh và xem danh sách ảnh nén */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-700 dark:text-slate-300">
                                            Hình ảnh (*):
                                        </label>
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            Đã chọn: {selectedImages.length} ảnh
                                        </span>
                                    </div>

                                    <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors">
                                        <ImageIcon className="w-4 h-4 text-slate-500" />
                                        <span>Chọn nhiều ảnh từ thiết bị</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleMultipleImagesSelect}
                                            className="hidden"
                                        />
                                    </label>

                                    {/* GRID ẢNH: CÓ Ô TRÒN TIẾN TRÌNH & NÚT THÙNG RÁC XÓA Ở TRÊN ĐẦU */}
                                    {selectedImages.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-2 max-h-64 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl">
                                            {selectedImages.map((img) => (
                                                <div
                                                    key={img.id}
                                                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square"
                                                >
                                                    <Image
                                                        src={img.previewUrl}
                                                        alt="Thumbnail"
                                                        fill
                                                        className="object-cover"
                                                    />

                                                    {/* NÚT XÓA Ở GÓC TRÊN ĐẦU ẢNH (Phòng chọn nhầm) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(img.id)}
                                                        className="absolute top-1.5 right-1.5 z-30 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full shadow-md transition-colors cursor-pointer"
                                                        title="Xóa ảnh này"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>

                                                    {/* VÒNG TRÒN TIẾN TRÌNH BÊN TRONG ẢNH */}
                                                    {img.status !== "READY" && (
                                                        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-white">
                                                            {img.status === "COMPRESSING" ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="relative w-8 h-8 flex items-center justify-center">
                                                                        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                                                                            <path
                                                                                className="text-slate-600"
                                                                                strokeWidth="3"
                                                                                stroke="currentColor"
                                                                                fill="none"
                                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            />
                                                                            <path
                                                                                className="text-amber-400 transition-all duration-300"
                                                                                strokeDasharray={`${img.progress}, 100`}
                                                                                strokeWidth="3"
                                                                                strokeLinecap="round"
                                                                                stroke="currentColor"
                                                                                fill="none"
                                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            />
                                                                        </svg>
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin absolute text-amber-400" />
                                                                    </div>
                                                                    <span className="text-[9px] font-bold text-amber-300">Đang nén</span>
                                                                </div>
                                                            ) : img.status === "UPLOADING" ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="relative w-8 h-8 flex items-center justify-center">
                                                                        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                                                                            <path
                                                                                className="text-slate-600"
                                                                                strokeWidth="3"
                                                                                stroke="currentColor"
                                                                                fill="none"
                                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            />
                                                                            <path
                                                                                className="text-blue-400 transition-all duration-300"
                                                                                strokeDasharray={`${img.progress}, 100`}
                                                                                strokeWidth="3"
                                                                                strokeLinecap="round"
                                                                                stroke="currentColor"
                                                                                fill="none"
                                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            />
                                                                        </svg>
                                                                        <span className="absolute text-[8px] font-mono font-bold text-blue-300">{img.progress}%</span>
                                                                    </div>
                                                                    <span className="text-[9px] font-bold text-blue-300">Tải lên</span>
                                                                </div>
                                                            ) : img.status === "DONE" ? (
                                                                <div className="flex flex-col items-center gap-0.5 text-emerald-400">
                                                                    <CheckCircle className="w-6 h-6" />
                                                                    <span className="text-[9px] font-bold">Xong</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-red-400">Lỗi ảnh</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Nhãn Ngang / Dọc */}
                                                    <span
                                                        className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded shadow-xs ${img.aspectRatio === "LANDSCAPE" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                                                            }`}
                                                    >
                                                        {img.aspectRatio === "LANDSCAPE" ? "Ngang" : "Dọc"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Thông báo tiến trình chi tiết khi đang lưu */}
                                {uploadStatusText && (
                                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-600 dark:text-blue-400 font-semibold text-xs">
                                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                        <span>{uploadStatusText}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-3.5 py-1.5 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isPending || selectedImages.some((i) => i.status === "COMPRESSING")}
                                        onClick={handleCreateSubmit}
                                        className="px-4 py-1.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Đang xử lý Cloud...</span>
                                            </>
                                        ) : isSuperAdmin ? (
                                            "Đăng lên Web"
                                        ) : (
                                            "Gửi HLV Trưởng duyệt"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN HLV TRƯỞNG */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-red-500/30">
                        <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <h4 className="text-sm font-bold uppercase tracking-wide">Xác nhận thao tác HLV Trưởng</h4>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            {pendingActionType === "DELETE" ? (
                                <p>Bạn đang chuẩn bị <strong className="text-red-600">XÓA VĨNH VIỄN</strong> sự kiện: <strong>{currentEvent.title}</strong> cùng toàn bộ ảnh trên Cloudflare R2.</p>
                            ) : pendingActionType === "UPDATE" ? (
                                <>
                                    <p><strong>Tiêu đề mới:</strong> {formTitle.trim().toUpperCase()}</p>
                                    <p><strong>Ngày mới:</strong> {formDate}</p>
                                </>
                            ) : (
                                <>
                                    <p><strong>Tiêu đề:</strong> {formTitle.trim().toUpperCase()}</p>
                                    <p><strong>Ngày diễn ra:</strong> {formDate}</p>
                                    <p><strong>Số lượng ảnh:</strong> {selectedImages.length} ảnh (Tải trực tiếp lên R2)</p>
                                </>
                            )}
                        </div>

                        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-3 text-[11px] text-red-700 dark:text-red-300">
                            ⚠️ <strong>Lưu ý:</strong> Thao tác này sẽ cập nhật trực tiếp lên Cloudflare R2 và cơ sở dữ liệu, <strong>không thể hoàn tác</strong>!
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setConfirmModalOpen(false)}
                                className="px-3.5 py-1.5 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={executeAction}
                                className={`px-4 py-1.5 font-bold rounded-lg text-xs shadow-xs text-white ${pendingActionType === "DELETE" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                                    }`}
                            >
                                {isPending ? "Đang xử lý..." : "Tôi hiểu, Xác nhận thực hiện"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal lưu trữ sự kiện cũ */}
            {archiveModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Archive className="w-5 h-5 text-red-600" />
                                <span>Lưu Trữ Sự Kiện Theo Năm</span>
                            </h3>
                            <button type="button" onClick={() => setArchiveModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {Object.keys(groupedOlderEvents).map((year) => (
                                <div key={year} className="space-y-2">
                                    <h4 className="text-xs font-bold font-mono text-red-600 uppercase border-b border-red-100 dark:border-red-950 pb-1">
                                        Năm {year}
                                    </h4>
                                    <div className="space-y-1.5">
                                        {groupedOlderEvents[year].map((evt) => (
                                            <div
                                                key={evt.id || evt.eventDate}
                                                onClick={() => {
                                                    const idx = events.findIndex((e) => e.id === evt.id);
                                                    if (idx !== -1) setSelectedEventIndex(idx);
                                                    setArchiveModalOpen(false);
                                                }}
                                                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{evt.title}</p>
                                                    {evt.description && (
                                                        <p className="text-[11px] text-slate-500 line-clamp-1">{evt.description}</p>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-mono text-slate-400 font-medium shrink-0 ml-2">
                                                    {evt.eventDate}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
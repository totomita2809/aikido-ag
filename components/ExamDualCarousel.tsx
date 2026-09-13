"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, X } from "lucide-react";

export default function ExamDualCarousel() {
    const [examDate, setExamDate] = useState<string>("");
    const [horizontalImages, setHorizontalImages] = useState<string[]>([]);
    const [verticalImages, setVerticalImages] = useState<string[]>([]);

    const [hIndex, setHIndex] = useState(0);
    const [vIndex1, setVIndex1] = useState(0);
    const [vIndex2, setVIndex2] = useState(1);

    // Trạng thái cho tính năng phóng to ảnh (Lightbox)
    const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/exam-photos")
            .then((res) => res.json())
            .then((data) => {
                if (data.latestDate) setExamDate(data.latestDate);
                if (data.horizontal) setHorizontalImages(data.horizontal);
                if (data.vertical) setVerticalImages(data.vertical);
            })
            .catch(() => {
                // Fallback dữ liệu mẫu nếu chưa có ảnh
                setExamDate("06-09-2026");
                setHorizontalImages(["/banner/banner-1.jpg"]);
                setVerticalImages(["/banner/banner-2.jpg", "/banner/banner-3.jpg"]);
            });
    }, []);

    // Tự động chạy slider ảnh ngang (mỗi 5 giây)
    useEffect(() => {
        if (horizontalImages.length <= 1) return;
        const timer = setInterval(() => {
            setHIndex((prev) => (prev + 1) % horizontalImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [horizontalImages.length]);

    // Tự động chạy slider ảnh dọc (hiển thị song song 2 ảnh với hiệu ứng chuyển ảnh mượt mà, mỗi 4.5 giây)
    useEffect(() => {
        if (verticalImages.length <= 1) return;
        const timer = setInterval(() => {
            setVIndex1((prev) => (prev + 1) % verticalImages.length);
            setVIndex2((prev) => (prev + 2) % verticalImages.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [verticalImages.length]);

    if (!examDate && horizontalImages.length === 0 && verticalImages.length === 0) {
        return null; // Không hiển thị nếu chưa có thư mục ảnh kỳ thi nào
    }

    const activeHList = horizontalImages.length > 0 ? horizontalImages : ["/banner/banner-1.jpg"];
    const activeVList = verticalImages.length > 0 ? verticalImages : ["/banner/banner-2.jpg"];
    const currentHImage = activeHList[hIndex % activeHList.length];
    const currentVImage1 = activeVList[vIndex1 % activeVList.length];
    const currentVImage2 = activeVList[vIndex2 % activeVList.length];

    return (
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Tiêu đề gọn gàng đúng yêu cầu */}
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Khoảnh khắc kỳ thi thăng cấp đai ({examDate})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Những hình ảnh nổi bật ghi nhận sự nỗ lực và tinh thần võ đạo của các môn sinh.
                    </p>
                </div>
            </div>

            {/* 2 Thẻ lớn song song cân đối */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

                {/* THẺ 1: ẢNH NGANG (Khung nhỏ bên trong tự co dãn, ôm sát và bo góc mượt mà theo kích thước ảnh) */}
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
                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${idx === (hIndex % activeHList.length) ? "opacity-100 z-10" : "opacity-0 z-0"
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

                {/* THẺ 2: ẢNH DỌC (2 khung nhỏ bên trong ôm sát và bo góc theo ảnh) */}
                <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner grid grid-cols-2 gap-4 p-4 items-center justify-items-center">
                    {activeVList.length > 0 ? (
                        <>
                            {/* Cột dọc 1 */}
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
                                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${idx === (vIndex1 % activeVList.length) ? "opacity-100 z-10" : "opacity-0 z-0"
                                            }`}
                                    >
                                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                                            <Image src={src} alt="Exam Vertical 1" fill className="object-cover rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none rounded-xl z-20" />
                            </div>

                            {/* Cột dọc 2 */}
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
                                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${idx === (vIndex2 % activeVList.length) ? "opacity-100 z-10" : "opacity-0 z-0"
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

            {/* LIGHTBOX MODAL (Phóng to ảnh toàn màn hình khi click) */}
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
                        <Image
                            src={activeLightboxImage}
                            alt="Exam Enlarged View"
                            fill
                            className="object-contain rounded-xl"
                            sizes="100vw"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
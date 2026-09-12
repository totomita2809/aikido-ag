"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export default function ExamDualCarousel() {
    const [examDate, setExamDate] = useState<string>("");
    const [horizontalImages, setHorizontalImages] = useState<string[]>([]);
    const [verticalImages, setVerticalImages] = useState<string[]>([]);

    const [hIndex, setHIndex] = useState(0);
    const [vIndex1, setVIndex1] = useState(0);
    const [vIndex2, setVIndex2] = useState(1);

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

    // Tự động chạy slider ảnh dọc (hiển thị song song 2 ảnh để lấp đầy thẻ, mỗi 4.5 giây)
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

    const currentVImage1 = verticalImages.length > 0 ? verticalImages[vIndex1 % verticalImages.length] : "";
    const currentVImage2 = verticalImages.length > 1 ? verticalImages[vIndex2 % verticalImages.length] : currentVImage1;

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* THẺ 1: ẢNH NGANG (Hiển thị 1 ảnh tràn viền, tự to rõ) */}
                <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
                    {horizontalImages.length > 0 ? (
                        horizontalImages.map((src, idx) => (
                            <div
                                key={src}
                                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === hIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                                    }`}
                            >
                                <Image src={src} alt="Exam Horizontal" fill className="object-cover" />
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Đang cập nhật ảnh kỳ thi...
                        </div>
                    )}
                </div>

                {/* THẺ 2: ẢNH DỌC (Ghép song song 2 ảnh dọc để cao bằng thẻ ngang, lấp đầy khung) */}
                <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner grid grid-cols-2 gap-2 p-2">
                    {verticalImages.length > 0 ? (
                        <>
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-black/40">
                                <Image src={currentVImage1} alt="Exam Vertical 1" fill className="object-cover" />
                            </div>
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-black/40">
                                <Image src={currentVImage2} alt="Exam Vertical 2" fill className="object-cover" />
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2 w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Đang cập nhật ảnh kỳ thi...
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
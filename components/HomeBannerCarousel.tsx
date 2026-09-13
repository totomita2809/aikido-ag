"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface BannerItem {
    id: number;
    image?: string;
    tag: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
}

const banners: BannerItem[] = [
    {
        id: 1,
        image: "/banner/banner-1.jpg", // Đảm bảo file tồn tại trong public/banner/banner-1.jpg (hoặc .png)
        tag: "VÕ ĐƯỜNG AIKIDO AN GIANG",
        titleLine1: "TINH HOA VÕ ĐẠO",
        titleLine2: "RÈN LUYỆN THÂN TÂM",
        description: "Chào mừng bạn đến với trang chính thức của võ đường Aikido An Giang. Nơi rèn luyện kỹ năng tự vệ, tinh thần kỷ luật và phát triển bản thân.",
        primaryButtonText: "Đăng nhập hệ thống nội bộ",
        primaryButtonLink: "/login",
        secondaryButtonText: "Xem lịch tập luyện",
        secondaryButtonLink: "#schedule",
    },
    {
        id: 2,
        image: "/banner/banner-2.jpg",
        tag: "MÔI TRƯỜNG CHUYÊN NGHIỆP",
        titleLine1: "KỶ LUẬT & ĐOÀN KẾT",
        titleLine2: "PHÁT TRIỂN MỖI NGÀY",
        description: "Cùng nhau luyện tập trên thảm, nâng cao thể lực, tinh thần võ sĩ đạo và xây dựng cộng đồng Aikido vững mạnh tại An Giang.",
        primaryButtonText: "Đang xây dựng...", //"Đăng ký môn sinh",
        primaryButtonLink: "#", //"/register",
        secondaryButtonText: "Đang xây dựng...", //"Tìm hiểu thêm",
        secondaryButtonLink: "#", //"/about",
    },
    {
        id: 3,
        image: "/banner/banner-3.jpg",
        tag: "KỲ THI THĂNG CẤP ĐAI",
        titleLine1: "CHINH PHỤC CẤP BẬC",
        titleLine2: "VƯƠNG TỚI ĐAI ĐEN",
        description: "Hệ thống quản lý lộ trình học tập, xét duyệt điều kiện thi thăng đai minh bạch, chính xác và chuyên nghiệp.",
        primaryButtonText: "Đang xây dựng...", //"Xem lịch thi đai",
        primaryButtonLink: "#", //"/promotions",
        secondaryButtonText: "Đang xây dựng...", // "Quy định đai",
        secondaryButtonLink: "#", //"/rules",
    },
];

export default function HomeBannerCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    return (
        /* Đã bỏ max-w-5xl để thẻ mở rộng bằng với các khối bên dưới */
        <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl bg-slate-100 dark:bg-slate-900 group">
            {/* Các Slide Banner */}
            <div className="relative min-h-[440px] sm:min-h-[480px] flex items-center">
                {banners.map((banner, index) => {
                    const isActive = index === currentIndex;
                    return (
                        <div
                            key={banner.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center p-8 sm:p-16 ${isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                                }`}
                        >
                            {/* Hiển thị ảnh nền từ thư mục public/banner/ với lớp phủ gradient tối ưu */}
                            {banner.image && (
                                <div className="absolute inset-0 z-0 overflow-hidden">
                                    <Image
                                        src={banner.image}
                                        alt={banner.titleLine1}
                                        fill
                                        className="object-cover object-center opacity-30 scale-105 transition-transform duration-1000 ease-out"
                                        priority={index === 0}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-100/90 dark:from-[#0b0f19] dark:via-[#0b0f19]/90 to-transparent" />
                                </div>
                            )}

                            {/* Nội dung Banner */}
                            <div className="relative z-10 max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
                                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span>{banner.tag}</span>
                                </div>

                                <div className="space-y-1">
                                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-tight text-slate-900 dark:text-white">
                                        {banner.titleLine1}
                                    </h1>
                                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-tight text-red-600 dark:text-red-500">
                                        {banner.titleLine2}
                                    </h2>
                                </div>

                                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {banner.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    {banner.primaryButtonLink === "#" ? (
                                        <span className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-xs sm:text-sm rounded-xl cursor-not-allowed opacity-75 border border-slate-300 dark:border-slate-700">
                                            {banner.primaryButtonText}
                                        </span>
                                    ) : (
                                        <Link
                                            href={banner.primaryButtonLink}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                                        >
                                            <span>{banner.primaryButtonText}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    )}

                                    {banner.secondaryButtonLink === "#" ? (
                                        <span className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-xs sm:text-sm rounded-xl cursor-not-allowed opacity-75 border border-slate-300 dark:border-slate-700">
                                            {banner.secondaryButtonText}
                                        </span>
                                    ) : banner.secondaryButtonLink.startsWith("#") ? (
                                        <a
                                            href={banner.secondaryButtonLink}
                                            className="px-6 py-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer inline-flex items-center"
                                        >
                                            <span>{banner.secondaryButtonText}</span>
                                        </a>
                                    ) : (
                                        <Link
                                            href={banner.secondaryButtonLink}
                                            className="px-6 py-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
                                        >
                                            <span>{banner.secondaryButtonText}</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Nút điều hướng trái/phải */}
            <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous slide"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer shadow-md"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <button
                type="button"
                onClick={nextSlide}
                aria-label="Next slide"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer shadow-md"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Các dấu chấm chỉ số (Dots indicator) */}
            <div className="absolute bottom-5 right-8 z-20 flex items-center space-x-2">
                {banners.map((_, idx) => (
                    <button
                        type="button"
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${currentIndex === idx ? "w-8 bg-red-600" : "w-2 bg-slate-400 dark:bg-slate-700 hover:bg-slate-500"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
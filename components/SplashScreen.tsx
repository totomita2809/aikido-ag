"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Shield } from "lucide-react";

interface SplashScreenProps {
    finishLoading?: () => void;
    logoName?: string;
    title?: string;
    subtitle?: string;
    text?: string;
}

export default function SplashScreen({
    finishLoading,
    logoName = "aikido ag",
    title = "AIKIDO AN GIANG",
    subtitle = "HỆ THỐNG QUẢN LÝ MÔN SINH",
    text,
}: SplashScreenProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [imgError, setImgError] = useState(false);

    const formattedName = logoName.trim().toLowerCase().replace(/\s+/g, "-");
    const logoPath = `/logo/logo_${formattedName}.png`;

    useEffect(() => {
        // Khóa cuộn trang trong lúc đang chạy splash
        document.body.style.overflow = "hidden";

        const animTimer = setTimeout(() => {
            setIsAnimating(true);
        }, 30);

        // Bắt đầu fade out nhẹ nhàng
        const fadeTimer = setTimeout(() => {
            setIsClosing(true);
        }, 1100);

        // Kết thúc và trả lại tương tác đầy đủ cho trang
        const endTimer = setTimeout(() => {
            document.body.style.overflow = "auto";
            if (finishLoading) {
                finishLoading();
            }
        }, 1400);

        return () => {
            document.body.style.overflow = "auto";
            clearTimeout(animTimer);
            clearTimeout(fadeTimer);
            clearTimeout(endTimer);
        };
    }, [finishLoading]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-opacity duration-300 select-none ${isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
        >
            <div
                className={`flex flex-col items-center transition-all duration-700 ease-out transform ${isAnimating
                        ? "scale-100 opacity-100 translate-y-0"
                        : "scale-75 opacity-0 translate-y-6"
                    }`}
            >
                <div className="relative flex items-center justify-center">
                    {/* Hào quang nền sáng */}
                    <div
                        className="absolute rounded-full bg-red-500/20 blur-3xl animate-pulse"
                        style={{ width: "clamp(260px, 45vw, 480px)", height: "clamp(260px, 45vw, 480px)" }}
                    />

                    {!imgError ? (
                        /* Container chứa Logo */
                        <div
                            className="relative rounded-full overflow-hidden border-4 border-red-500/30 p-4 shadow-2xl bg-white flex items-center justify-center"
                            style={{
                                width: "clamp(220px, 32vw, 360px)",
                                height: "clamp(220px, 32vw, 360px)",
                            }}
                        >
                            <Image
                                src={logoPath}
                                alt={title}
                                fill
                                sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 360px"
                                className="object-contain p-3"
                                onError={() => setImgError(true)}
                                priority
                            />
                        </div>
                    ) : (
                        <div
                            className="relative rounded-full border-4 border-red-500/30 bg-white shadow-2xl flex items-center justify-center"
                            style={{
                                width: "clamp(220px, 32vw, 360px)",
                                height: "clamp(220px, 32vw, 360px)",
                            }}
                        >
                            <Shield className="w-32 h-32 text-red-600 animate-bounce" />
                        </div>
                    )}
                </div>

                {/* Tiêu đề */}
                <div className="mt-8 text-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-slate-900 dark:text-white uppercase">
                        {title}
                    </h1>
                    <div className="w-20 h-1.5 bg-red-600 mx-auto mt-2.5 rounded-full animate-pulse" />
                    <p className="text-xs sm:text-sm tracking-wider text-slate-500 dark:text-slate-400 mt-2.5 font-medium">
                        {subtitle}
                    </p>

                    {/* Hiển thị dòng chữ trạng thái khi có prop text */}
                    {text && (
                        <div className="flex items-center justify-center space-x-2 mt-4">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                            <span className="text-sm font-semibold tracking-wide text-red-600 dark:text-red-400">
                                {text}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
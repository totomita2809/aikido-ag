"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { INSTRUCTOR_GROUPS } from "@/lib/constants";

interface Instructor {
    dojo: string;
    name: string;
    role: string;
    rank: string;
    experience: string;
    unit: string;
    code: string | number;
    avatar?: string;
}

const FALLBACK_INSTRUCTORS: Instructor[] = (INSTRUCTOR_GROUPS.anGiang?.instructors as Instructor[]) || [];

function cleanUnicode(str: string | null | undefined): string {
    if (!str) return "";
    return str.normalize("NFC");
}

function InstructorAvatar({ instructor }: { instructor: Instructor }) {
    const extensions: string[] = ["jpg", "jpeg", "png", "webp", "avif"];
    const [dbFailed, setDbFailed] = useState<boolean>(false);
    const [extIndex, setExtIndex] = useState<number>(0);
    const [failedAll, setFailedAll] = useState<boolean>(false);

    const useDb: boolean = Boolean(instructor.avatar && !dbFailed);
    const currentExt: string = extensions[extIndex];
    const localSrc: string = `/assets/images/trainers/${instructor.unit}/${instructor.code}.${currentExt}`;
    const imageSrc: string = useDb && instructor.avatar ? instructor.avatar : localSrc;

    const handleError = (): void => {
        if (useDb) {
            setDbFailed(true);
        } else if (extIndex < extensions.length - 1) {
            setExtIndex((prev: number) => prev + 1);
        } else {
            setFailedAll(true);
        }
    };

    if (failedAll) {
        return (
            <div className="w-full h-full rounded-full flex items-center justify-center bg-stone-300 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-lg">
                {cleanUnicode(instructor.name)
                    .split(" ")
                    .slice(-2)
                    .map((n: string) => n[0] || "")
                    .join("")}
            </div>
        );
    }

    return (
        <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
                key={imageSrc}
                src={imageSrc}
                alt={cleanUnicode(instructor.name)}
                fill
                unoptimized
                onError={handleError}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
        </div>
    );
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
    const dojoClean: string = cleanUnicode(instructor.dojo);
    const nameClean: string = cleanUnicode(instructor.name);
    const roleClean: string = cleanUnicode(instructor.role);
    const rankClean: string = cleanUnicode(instructor.rank);
    const expClean: string = cleanUnicode(instructor.experience);

    return (
        <div className="group relative w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border border-stone-300 dark:border-stone-800 bg-[#fbf9f5] dark:bg-[#121211] p-5 sm:p-6 flex flex-col md:flex-row items-center gap-6 animate-fadeIn">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0 flex items-center justify-center">
                <svg
                    viewBox="0 0 240 240"
                    className="w-full h-full overflow-visible pointer-events-none relative z-0"
                >
                    <defs>
                        <filter id="sumi-clean" x="-20%" y="-20%" width="140%" height="140%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                    </defs>
                    <g filter="url(#sumi-clean)">
                        <path
                            d="M120 12C60 12 14 58 16 118C18 174 64 220 122 218C178 216 222 170 218 116"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="10"
                            strokeLinecap="round"
                            className="text-stone-400 dark:text-amber-600/35 opacity-40"
                        />
                        <path
                            d="M120 20C66 20 22 64 24 118C26 172 70 216 125 214C176 212 218 168 214 116C210 68 170 28 135 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="13"
                            strokeLinecap="round"
                            className="text-stone-800 dark:text-amber-500 opacity-90"
                        />
                        <path
                            d="M135 24 Q145 20 155 26 Q162 32 168 40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeDasharray="1.5 2.5 0.8 3"
                            strokeLinecap="round"
                            className="text-stone-700 dark:text-amber-400 opacity-75"
                        />
                    </g>
                </svg>

                <div className="absolute inset-5 sm:inset-6 rounded-full overflow-hidden border-2 border-stone-300/80 dark:border-stone-700 shadow-inner bg-stone-200 dark:bg-stone-800 z-10">
                    <InstructorAvatar instructor={instructor} />
                </div>
            </div>

            <div className="flex-1 w-full flex flex-col justify-center space-y-2.5 relative z-30">
                <div className="relative px-3 py-1.5 flex items-center overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-stone-300 dark:text-amber-500/25 z-0" viewBox="0 0 300 36" preserveAspectRatio="none">
                        <path d="M0,20 Q150,16 295,20 Q300,21 295,24 Q150,25 0,22 Z" fill="currentColor" />
                    </svg>
                    <span className="relative z-30 text-[10px] sm:text-xs font-bold tracking-widest text-stone-600 dark:text-amber-400/90 uppercase truncate w-full">
                        {dojoClean}
                    </span>
                </div>

                <div className="relative px-3 py-1 flex items-center overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-stone-300 dark:text-amber-500/25 z-0" viewBox="0 0 300 40" preserveAspectRatio="none">
                        <path d="M0,22 Q150,18 295,22 Q300,23 295,26 Q150,27 0,24 Z" fill="currentColor" />
                    </svg>
                    <h4 className="relative z-30 text-base sm:text-lg font-black text-stone-900 dark:text-amber-100 tracking-tight truncate w-full">
                        {nameClean}
                    </h4>
                </div>

                <div className="relative px-3 py-1 flex items-center overflow-hidden text-xs sm:text-sm font-bold text-red-700 dark:text-red-400">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-stone-300 dark:text-amber-500/20 z-0" viewBox="0 0 300 36" preserveAspectRatio="none">
                        <path d="M0,18 Q150,15 295,19 Q300,20 295,22 Q150,23 0,20 Z" fill="currentColor" />
                    </svg>
                    <span className="relative z-30 flex items-center gap-1.5 truncate w-full">
                        <span className="text-[10px] flex-shrink-0">◆</span>
                        <span className="truncate">{roleClean}</span>
                    </span>
                </div>

                <div className="relative px-3 py-1 flex items-center overflow-hidden text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-stone-300 dark:text-amber-500/20 z-0" viewBox="0 0 300 36" preserveAspectRatio="none">
                        <path d="M0,18 Q150,15 295,19 Q300,20 295,22 Q150,23 0,20 Z" fill="currentColor" />
                    </svg>
                    <span className="relative z-30 flex items-center gap-1.5 truncate w-full">
                        <span className="text-[10px] text-stone-500 flex-shrink-0">◆</span>
                        <span className="truncate">{rankClean}</span>
                    </span>
                </div>

                {expClean ? (
                    <div className="relative px-3 py-1 flex items-center overflow-hidden text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none text-stone-300 dark:text-amber-500/20 z-0" viewBox="0 0 300 36" preserveAspectRatio="none">
                            <path d="M0,18 Q150,15 295,19 Q300,20 295,22 Q150,23 0,20 Z" fill="currentColor" />
                        </svg>
                        <span className="relative z-30 flex items-center gap-1.5 truncate w-full">
                            <span className="text-[10px] text-stone-500 flex-shrink-0">◆</span>
                            <span className="truncate">{expClean}</span>
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function InstructorSection() {
    console.log("FALLBACK CHECK:", FALLBACK_INSTRUCTORS);
    const [groupData, setGroupData] = useState<{
        title: string;
        subtitle: string;
        instructors: Instructor[];
    }>({
        title: INSTRUCTOR_GROUPS.anGiang?.title || "Đội ngũ Aikido An Giang",
        subtitle: INSTRUCTOR_GROUPS.anGiang?.subtitle || "Những người dẫn dắt và phát triển phong trào võ đạo tại tỉnh nhà.",
        instructors: FALLBACK_INSTRUCTORS,
    });
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;
        async function fetchAnGiangData(): Promise<void> {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);

                const res: Response = await fetch('/api/instructors/an-giang', {
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && data?.instructors && data.instructors.length > 0) {
                        setGroupData((prev) => ({
                            ...prev,
                            title: data.title || prev.title,
                            subtitle: data.subtitle || prev.subtitle,
                            instructors: data.instructors,
                        }));
                    }
                }
            } catch (err: unknown) {
                console.warn("API HLV chậm/timeout, giữ nguyên fallback:", err);
            }
        }
        fetchAnGiangData();
        return () => {
            isMounted = false;
        };
    }, []);


    const instructorsList: Instructor[] = groupData.instructors.length > 0 ? groupData.instructors : FALLBACK_INSTRUCTORS;

    useEffect(() => {
        if (instructorsList.length <= 2) return;
        const interval: NodeJS.Timeout = setInterval(() => {
            setCurrentIndex((prev: number) => (prev + 1) % instructorsList.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [instructorsList.length]);

    const handlePrev = (): void => {
        setCurrentIndex((prev: number) =>
            prev === 0 ? instructorsList.length - 1 : prev - 1
        );
    };

    const handleNext = (): void => {
        setCurrentIndex((prev: number) => (prev + 1) % instructorsList.length);
    };

    const firstInstructor: Instructor | undefined = instructorsList[currentIndex] || instructorsList[0];
    const secondInstructor: Instructor | undefined =
        instructorsList[(currentIndex + 1) % instructorsList.length] ||
        firstInstructor;

    return (
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Đội ngũ giảng dạy chuyên môn
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {groupData.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {groupData.subtitle} — Hiển thị HLV {instructorsList.length > 0 ? currentIndex + 1 : 0}/
                        {instructorsList.length}
                    </p>
                </div>

                {instructorsList.length > 2 && (
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <button
                            onClick={handlePrev}
                            aria-label="Previous instructor"
                            className="p-2 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNext}
                            aria-label="Next instructor"
                            className="p-2 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {instructorsList.length === 0 ? (
                <div className="text-center py-12 text-sm text-stone-500 dark:text-stone-400">
                    Chưa có dữ liệu huấn luyện viên hiển thị.
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 transition-all duration-500">
                    {firstInstructor && (
                        <InstructorCard
                            key={`card-1-${firstInstructor.code}-${currentIndex}`}
                            instructor={firstInstructor}
                        />
                    )}
                    {secondInstructor && (
                        <InstructorCard
                            key={`card-2-${secondInstructor.code}-${currentIndex}`}
                            instructor={secondInstructor}
                        />
                    )}
                </div>
            )}
        </section>
    );
}
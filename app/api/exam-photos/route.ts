import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { imageSize } from "image-size";
import { prisma } from "@/lib/prisma";

export interface CarouselEventItem {
    id: string;
    eventKey?: string;
    title: string;
    eventDate: string;
    description?: string;
    horizontalImages: string[];
    verticalImages: string[];
    createdAt?: string;
}

export async function GET() {
    const eventsMap = new Map<string, CarouselEventItem>();

    // 1. LẤY DỮ LIỆU TỪ DATABASE (Ảnh đã lưu trên Cloudflare R2)
    try {
        const prismaAny = prisma as unknown as {
            carouselEvent?: {
                findMany: (args: {
                    where: { status: string };
                    orderBy: { eventDate: "desc" };
                }) => Promise<Array<{
                    id: string;
                    eventKey: string | null;
                    title: string;
                    eventDate: Date;
                    description: string | null;
                    imageUrl: string;
                    aspectRatio: string;
                    createdAt: Date;
                }>>;
            };
        };

        if (prismaAny.carouselEvent) {
            const dbRecords = await prismaAny.carouselEvent.findMany({
                where: { status: "APPROVED" },
                orderBy: { eventDate: "desc" },
            });

            for (const record of dbRecords) {
                // Định dạng ngày dd-MM-yyyy
                const d = new Date(record.eventDate);
                const dd = String(d.getDate()).padStart(2, "0");
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const yyyy = d.getFullYear();
                const dateStr = `${dd}-${mm}-${yyyy}`;

                // Dùng eventKey hoặc groupKey để gom ảnh cùng sự kiện
                const groupKey = record.eventKey || `${record.title}_${dateStr}`;

                if (!eventsMap.has(groupKey)) {
                    eventsMap.set(groupKey, {
                        id: record.id,
                        eventKey: record.eventKey || undefined,
                        title: record.title,
                        eventDate: dateStr,
                        description: record.description || undefined,
                        horizontalImages: [],
                        verticalImages: [],
                        createdAt: record.createdAt.toISOString(),
                    });
                }

                const current = eventsMap.get(groupKey)!;
                if (record.aspectRatio === "PORTRAIT") {
                    current.verticalImages.push(record.imageUrl);
                } else {
                    current.horizontalImages.push(record.imageUrl);
                }
            }
        }
    } catch (err) {
        console.error("Lỗi khi đọc dữ liệu sự kiện từ DB:", err);
    }

    // 2. LẤY DỮ LIỆU TỪ THƯ MỤC CŨ public/exam (Nếu có ảnh lưu trước đó)
    try {
        const examDir = path.join(process.cwd(), "public", "exam");
        if (fs.existsSync(examDir)) {
            const items = fs.readdirSync(examDir);
            const subDirs = items.filter((item) => {
                const fullPath = path.join(examDir, item);
                return fs.statSync(fullPath).isDirectory();
            });

            const validFolders = subDirs.filter((folderName: string) =>
                /^\d{2}-\d{2}-\d{4}$/.test(folderName)
            );

            for (const folder of validFolders) {
                // Nếu ngày này chưa có trong Database thì thêm từ thư mục tĩnh
                if (!eventsMap.has(`static_${folder}`)) {
                    const folderPath = path.join(examDir, folder);
                    const files = fs.readdirSync(folderPath);
                    const hList: string[] = [];
                    const vList: string[] = [];

                    files.forEach((file: string) => {
                        if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
                            const filePath = path.join(folderPath, file);
                            const publicPath = `/exam/${folder}/${file}`;
                            try {
                                const buffer = fs.readFileSync(filePath);
                                const dimensions = imageSize(buffer);
                                if (dimensions?.width && dimensions?.height) {
                                    if (dimensions.width >= dimensions.height) {
                                        hList.push(publicPath);
                                    } else {
                                        vList.push(publicPath);
                                    }
                                } else {
                                    if (file.toLowerCase().includes("v")) vList.push(publicPath);
                                    else hList.push(publicPath);
                                }
                            } catch {
                                hList.push(publicPath);
                            }
                        }
                    });

                    if (hList.length > 0 || vList.length > 0) {
                        eventsMap.set(`static_${folder}`, {
                            id: `static-${folder}`,
                            eventKey: `legacy-${folder}`,
                            title: "KHOẢNH KHẮC KỲ THI THĂNG CẤP ĐAI",
                            eventDate: folder,
                            description: "Những hình ảnh nổi bật ghi nhận sự nỗ lực và tinh thần võ đạo của các môn sinh.",
                            horizontalImages: hList,
                            verticalImages: vList,
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error("Lỗi khi đọc file tĩnh public/exam:", err);
    }

    // 3. SẮP XẾP DANH SÁCH SỰ KIỆN THEO NGÀY MỚI NHẤT LÊN ĐẦU
    const events = Array.from(eventsMap.values()).sort((a, b) => {
        const [d1, m1, y1] = a.eventDate.split("-").map(Number);
        const [d2, m2, y2] = b.eventDate.split("-").map(Number);
        const date1 = new Date(y1, m1 - 1, d1).getTime();
        const date2 = new Date(y2, m2 - 1, d2).getTime();
        return date2 - date1;
    });

    const latestEvent = events[0];

    return NextResponse.json({
        events,
        latestDate: latestEvent?.eventDate || "",
        horizontal: latestEvent?.horizontalImages || [],
        vertical: latestEvent?.verticalImages || [],
    });
}
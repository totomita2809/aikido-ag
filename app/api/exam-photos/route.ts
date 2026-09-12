import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { imageSize } from "image-size";

export async function GET() {
    const examDir = path.join(process.cwd(), "public", "exam");

    if (!fs.existsSync(examDir)) {
        return NextResponse.json({ latestDate: "", horizontal: [], vertical: [] });
    }

    // Đọc danh sách thư mục con an toàn bằng fs.readdirSync thuần túy
    const items = fs.readdirSync(examDir);
    const subDirs = items.filter((item) => {
        const fullPath = path.join(examDir, item);
        return fs.statSync(fullPath).isDirectory();
    });

    // Lọc các thư mục có định dạng ngày tháng dd-MM-yyyy
    const validFolders = subDirs.filter((folderName: string) => /^\d{2}-\d{2}-\d{4}$/.test(folderName));

    if (validFolders.length === 0) {
        return NextResponse.json({ latestDate: "", horizontal: [], vertical: [] });
    }

    // Sắp xếp ngày tháng giảm dần để chọn thư mục mới nhất
    validFolders.sort((a: string, b: string) => {
        const [d1, m1, y1] = a.split("-").map(Number);
        const [d2, m2, y2] = b.split("-").map(Number);
        const date1 = new Date(y1, m1 - 1, d1).getTime();
        const date2 = new Date(y2, m2 - 1, d2).getTime();
        return date2 - date1;
    });

    const latestDate = validFolders[0];
    const folderPath = path.join(examDir, latestDate);
    const files = fs.readdirSync(folderPath);

    const horizontal: string[] = [];
    const vertical: string[] = [];

    files.forEach((file: string) => {
        if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
            const filePath = path.join(folderPath, file);
            const publicPath = `/exam/${latestDate}/${file}`;
            try {
                const buffer = fs.readFileSync(filePath);
                const dimensions = imageSize(buffer);

                if (dimensions && dimensions.width && dimensions.height) {
                    if (dimensions.width >= dimensions.height) {
                        horizontal.push(publicPath);
                    } else {
                        vertical.push(publicPath);
                    }
                } else {
                    if (file.toLowerCase().includes("v")) vertical.push(publicPath);
                    else horizontal.push(publicPath);
                }
            } catch {
                horizontal.push(publicPath);
            }
        }
    });

    return NextResponse.json({ latestDate, horizontal, vertical });
}
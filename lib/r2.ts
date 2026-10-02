import {
    S3Client,
    PutObjectCommand,
    ListObjectsV2Command,
    CopyObjectCommand,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

/**
 * Sinh Presigned URL để client upload trực tiếp lên Cloudflare R2
 */
export async function getPresignedUploadUrl(
    key: string,
    contentType: string = "image/webp"
): Promise<{ uploadUrl: string; publicUrl: string }> {
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });

    // Link có hạn sử dụng trong 10 phút (600 giây)
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });

    return {
        uploadUrl,
        publicUrl: `${publicUrl}/${key}`,
    };
}

/**
 * Chuyển đổi tiếng Việt có dấu thành không dấu, thay khoảng trắng bằng dấu gạch ngang
 * Hỗ trợ cả tên file (giữ lại đuôi mở rộng .jpg, .png...)
 */
export function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-_.]/g, "") // Giữ lại chữ, số, gạch nối, gạch dưới, dấu chấm đuôi file
        .trim()
        .replace(/\s+/g, "-");
}

/**
 * Tạo folder name theo format yêu cầu:
 * [tieu-de-khong-dau]_[dd-MM-yyyy]_[eventKey]
 */
export function buildEventFolderName(title: string, eventDateStr: string, eventKey: string): string {
    const slugTitle = slugify(title);
    const safeDate = eventDateStr.trim().replace(/\//g, "-"); // 21/09/2026 -> 21-09-2026
    return `${slugTitle}_${safeDate}_${eventKey}`;
}

/**
 * Upload ảnh lên đúng thư mục sự kiện
 */
export async function uploadEventImageToR2(
    base64Data: string,
    folderName: string,
    originalFileName?: string,
    index = 1
): Promise<string> {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Định dạng ảnh Base64 không hợp lệ");
    }

    const contentType = matches[1];
    const defaultExt = contentType.split("/")[1] || "jpg";
    const buffer = Buffer.from(matches[2], "base64");

    // Chuẩn hóa tên file ảnh (chuyển tiếng Việt thành không dấu)
    let cleanFileName = `anh-${index}.${defaultExt}`;
    if (originalFileName) {
        cleanFileName = slugify(originalFileName);
    }

    const fullKey = `${folderName}/${cleanFileName}`;

    await r2Client.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fullKey,
            Body: buffer,
            ContentType: contentType,
        })
    );

    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    return `${publicUrl}/${fullKey}`;
}

/**
 * Đổi tên thư mục trên R2 khi HLV sửa tiêu đề hoặc ngày
 * Quét theo eventKey độc nhất -> Di chuyển sang thư mục mới -> Trả về danh sách URL mới
 */
export async function renameEventFolderOnR2(
    eventKey: string,
    newFolderName: string
): Promise<{ oldKey: string; newKey: string; newUrl: string }[]> {
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

    // 1. Quét toàn bộ object trong bucket
    const listRes = await r2Client.send(
        new ListObjectsV2Command({
            Bucket: bucket,
        })
    );

    if (!listRes.Contents || listRes.Contents.length === 0) return [];

    // 2. Tìm đúng các file nằm trong thư mục có chứa eventKey độc nhất
    const targetFiles = listRes.Contents.filter(
        (item) => item.Key && item.Key.includes(`_${eventKey}/`)
    );

    const updatedUrls: { oldKey: string; newKey: string; newUrl: string }[] = [];

    // 3. Copy sang folder mới và xóa folder cũ
    for (const file of targetFiles) {
        if (!file.Key) continue;
        const fileName = file.Key.split("/").pop();
        const newKey = `${newFolderName}/${fileName}`;

        // Copy sang tên mới
        await r2Client.send(
            new CopyObjectCommand({
                Bucket: bucket,
                CopySource: `${bucket}/${file.Key}`,
                Key: newKey,
            })
        );

        // Xóa file cũ
        await r2Client.send(
            new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: [{ Key: file.Key }] },
            })
        );

        updatedUrls.push({
            oldKey: file.Key,
            newKey,
            newUrl: `${publicUrl}/${newKey}`,
        });
    }

    return updatedUrls;
}

/**
 * Xóa toàn bộ thư mục và ảnh trên R2 khi xóa sự kiện
 */
export async function deleteEventFolderOnR2(eventKey: string): Promise<void> {
    const bucket = process.env.R2_BUCKET_NAME;

    const listRes = await r2Client.send(
        new ListObjectsV2Command({
            Bucket: bucket,
        })
    );

    if (!listRes.Contents || listRes.Contents.length === 0) return;

    // Tìm tất cả các file có chứa eventKey độc nhất
    const objectsToDelete = listRes.Contents
        .filter((item) => item.Key && item.Key.includes(`_${eventKey}/`))
        .map((item) => ({ Key: item.Key! }));

    if (objectsToDelete.length > 0) {
        await r2Client.send(
            new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: objectsToDelete },
            })
        );
    }
}
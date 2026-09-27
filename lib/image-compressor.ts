/**
 * Tiện ích nén ảnh dùng chung cho toàn bộ dự án
 */

export interface CompressedImageResult {
    /** Chuỗi base64 của ảnh đã nén (chuẩn WebP) */
    base64: string;
    /** Tên file sạch đã đổi đuôi sang .webp */
    fileName: string;
    /** Chiều ngang sau nén */
    width: number;
    /** Chiều dọc sau nén */
    height: number;
    /** Tỷ lệ khung hình */
    aspectRatio: "LANDSCAPE" | "PORTRAIT";
    /** Dung lượng ước tính sau khi nén (bytes) */
    approxSizeInBytes: number;
}

export interface CompressImageOptions {
    /** Chiều dài/rộng tối đa (mặc định: 2048px chuẩn 2K nét căng) */
    maxDimension?: number;
    /** Chất lượng nén từ 0.1 đến 1.0 (mặc định: 0.85 - tối ưu độ nét và dung lượng) */
    quality?: number;
    /** Định dạng xuất: "image/webp" hoặc "image/jpeg" (mặc định: image/webp) */
    mimeType?: "image/webp" | "image/jpeg";
}

/**
 * Nén một file ảnh từ máy tính/điện thoại
 */
export async function compressImage(
    file: File,
    options: CompressImageOptions = {}
): Promise<CompressedImageResult> {
    const {
        maxDimension = 2048,
        quality = 0.85,
        mimeType = "image/webp",
    } = options;

    return new Promise((resolve, reject) => {
        // Kiểm tra xem có đúng là file ảnh không
        if (!file.type.startsWith("image/")) {
            return reject(new Error("Tệp được chọn không phải là hình ảnh hợp lệ."));
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event: ProgressEvent<FileReader>) => {
            const rawBase64 = event.target?.result;
            if (typeof rawBase64 !== "string") {
                return reject(new Error("Không thể đọc dữ liệu hình ảnh."));
            }

            const img = new Image();
            img.src = rawBase64;

            img.onload = () => {
                let { naturalWidth: width, naturalHeight: height } = img;
                const aspect: "LANDSCAPE" | "PORTRAIT" =
                    width >= height ? "LANDSCAPE" : "PORTRAIT";

                // Tính toán tỷ lệ co kích thước mà không làm méo hoặc bể hình
                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    return reject(new Error("Không thể khởi tạo Canvas 2D context."));
                }

                // Thuật toán làm mịn cao cấp chống vỡ nét
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                // Vẽ ảnh lên canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Xuất ảnh nén
                const compressedBase64 = canvas.toDataURL(mimeType, quality);

                // Ước tính dung lượng file sau nén
                const stringLength = compressedBase64.length - "data:image/webp;base64,".length;
                const sizeInBytes = Math.floor(stringLength * 0.75);

                // Đổi phần mở rộng tên file sang .webp
                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const ext = mimeType === "image/webp" ? "webp" : "jpg";
                const cleanFileName = `${baseName}.${ext}`;

                resolve({
                    base64: compressedBase64,
                    fileName: cleanFileName,
                    width,
                    height,
                    aspectRatio: aspect,
                    approxSizeInBytes: sizeInBytes,
                });
            };

            img.onerror = () => {
                reject(new Error("Không thể tải và xử lý hình ảnh này."));
            };
        };

        reader.onerror = () => {
            reject(new Error("Đã xảy ra lỗi trong quá trình đọc file."));
        };
    });
}

/**
 * Nén đồng loạt danh sách nhiều file ảnh (chạy song song tốc độ cao)
 */
export async function compressMultipleImages(
    files: FileList | File[],
    options: CompressImageOptions = {}
): Promise<CompressedImageResult[]> {
    const filesArray = Array.from(files);
    return Promise.all(filesArray.map((file) => compressImage(file, options)));
}
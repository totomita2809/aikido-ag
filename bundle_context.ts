import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = 'project_context.txt';

const IGNORE_DIRS = new Set([
    'node_modules',
    '.next',
    '.git',
    '.vscode',
    'dist',
    'build',
    'coverage',
    'public'
]);

const IGNORE_FILES = new Set([
    'project_context.txt',
    'bundle_context.ts',
    'bundle_context.js',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.env',
    '.env.local',
    '.env.production'
]);

const ALLOWED_EXTS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.json', '.prisma', '.css', '.md', '.sql'
]);

let totalFiles = 0;
const rootDir = process.cwd();
const outputStream = fs.createWriteStream(path.join(rootDir, OUTPUT_FILE), { encoding: 'utf-8' });

function scanDir(dir: string, relativePath = ''): void {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relPath = path.join(relativePath, item.name);

        if (item.isDirectory()) {
            if (!IGNORE_DIRS.has(item.name)) {
                scanDir(fullPath, relPath);
            }
        } else if (item.isFile()) {
            if (IGNORE_FILES.has(item.name)) continue;

            const ext = path.extname(item.name).toLowerCase();
            if (ALLOWED_EXTS.has(ext)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    outputStream.write(`\n\n==================================================\n`);
                    outputStream.write(`FILE: ${relPath.replace(/\\/g, '/')}\n`);
                    outputStream.write(`==================================================\n\n`);
                    outputStream.write(content);
                    totalFiles++;
                    console.log(`✓ Đã nạp: ${relPath}`);
                } catch {
                    console.warn(`! Bỏ qua (không đọc được): ${relPath}`);
                }
            }
        }
    }
}

console.log('--- Bắt đầu đóng gói mã nguồn dự án ---');
outputStream.write(`TỔNG HỢP MÃ NGUỒN DỰ ÁN AIKIDO-AG\n`);
outputStream.write(`Thời điểm tạo: ${new Date().toLocaleString('vi-VN')}\n\n`);

scanDir(rootDir);

outputStream.end(() => {
    console.log('-------------------------------------------');
    console.log(`Hoàn tất! Đã gom ${totalFiles} file vào: ${OUTPUT_FILE}`);
    console.log(`Bạn có thể tải file '${OUTPUT_FILE}' lên để được hỗ trợ.`);
});
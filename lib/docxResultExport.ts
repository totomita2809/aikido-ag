import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    AlignmentType,
    WidthType,
    PageOrientation,
    VerticalAlign,
    HeightRule,
    VerticalMergeType,
    BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

export interface CandidateResultExportItem {
    order: number;
    fullName: string;
    dob: string;
    currentRank: string;
    targetRank: string;
    score: number;
    titleHonor: string;
    isPassed: boolean;
}

function toNFD(str: string): string {
    return str ? str.normalize("NFD") : "";
}

export function roundScore(score: number): number {
    return Math.round(score * 100) / 100;
}

export function formatScoreVN(score: number): string {
    const rounded = roundScore(score);
    const parts = rounded.toFixed(2).split(".");
    if (parts[1] === "00") return `${parts[0]},0`;
    if (parts[1].endsWith("0")) return `${parts[0]},${parts[1][0]}`;
    return `${parts[0]},${parts[1]}`;
}

export async function generateExamResultDocx(
    examDate: Date,
    candidates: CandidateResultExportItem[]
) {
    const d = examDate;
    const dayStr = String(d.getDate()).padStart(2, "0");
    const monthStr = String(d.getMonth() + 1).padStart(2, "0");
    const yearStr = String(d.getFullYear());

    const titleDateStr = `NGÀY ${dayStr}/${monthStr}/${yearStr}`;
    const signDateStr = `Long Xuyên, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`;

    const totalCount = candidates.length;
    const passedCount = candidates.filter((c) => c.isPassed).length;
    const passRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1).replace(".", ",") : "0";

    const tableHeader = new TableRow({
        tableHeader: true,
        cantSplit: true,
        height: { value: 500, rule: HeightRule.ATLEAST },
        children: [
            createCell("STT", 600, AlignmentType.CENTER, true),
            createCell("HỌ VÀ TÊN", 3000, AlignmentType.CENTER, true),
            createCell("NĂM SINH", 1500, AlignmentType.CENTER, true),
            createCell("CẤP ĐAI", 1600, AlignmentType.CENTER, true),
            createCell("ĐIỂM THI", 1100, AlignmentType.CENTER, true),
            createCell("DANH HIỆU", 2200, AlignmentType.CENTER, true),
        ],
    });

    const tableRows: TableRow[] = [];

    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const isNotQualified = !c.isPassed;
        const rankText = `${c.currentRank}\n=> ${c.targetRank}`;

        const isGroupStart = i === 0 || candidates[i - 1].currentRank !== c.currentRank || candidates[i - 1].targetRank !== c.targetRank;
        const isGroupContinued = i < candidates.length - 1 && candidates[i + 1].currentRank === c.currentRank && candidates[i + 1].targetRank === c.targetRank;

        let rankCell: TableCell;
        if (isGroupStart && isGroupContinued) {
            rankCell = createRankCell(rankText, 1600, VerticalMergeType.RESTART);
        } else if (!isGroupStart) {
            rankCell = createRankCell("", 1600, VerticalMergeType.CONTINUE);
        } else {
            rankCell = createRankCell(rankText, 1600);
        }

        tableRows.push(
            new TableRow({
                cantSplit: true,
                height: { value: 500, rule: HeightRule.ATLEAST },
                children: [
                    createCell(String(i + 1), 600, AlignmentType.CENTER),
                    createCell(toNFD(c.fullName.toUpperCase()), 3000, AlignmentType.LEFT, false, true),
                    createCell(c.dob || "—", 1500, AlignmentType.CENTER),
                    rankCell,
                    createCell(formatScoreVN(c.score), 1100, AlignmentType.CENTER, true),
                    createCell(toNFD(c.titleHonor), 2200, AlignmentType.CENTER, !isNotQualified, false, isNotQualified),
                ],
            })
        );
    }

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: { orientation: PageOrientation.PORTRAIT },
                        margin: { top: 950, bottom: 950, left: 950, right: 950 },
                    },
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: toNFD("- BỘ MÔN AIKIDO -"),
                                bold: true,
                                size: 21,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 40, after: 40 },
                        children: [
                            new TextRun({
                                text: toNFD("TRUNG TÂM HOẠT ĐỘNG THANH THIẾU NHI"),
                                bold: true,
                                size: 21,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: toNFD("VÀ KHỞI NGHIỆP THANH NIÊN TỈNH AN GIANG"),
                                bold: true,
                                size: 21,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 60 },
                        children: [
                            new TextRun({
                                text: toNFD("BẢNG ĐIỂM KẾT QUẢ THI THĂNG ĐAI"),
                                bold: true,
                                size: 28,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 250 },
                        children: [
                            new TextRun({
                                text: toNFD(titleDateStr),
                                bold: true,
                                size: 22,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [tableHeader, ...tableRows],
                    }),
                    new Paragraph({
                        spacing: { before: 240, after: 180 },
                        children: [
                            new TextRun({
                                text: toNFD(`TỈ LỆ ĐẬU : ${passRate}% (${passedCount}/${totalCount} môn sinh)`),
                                bold: true,
                                italics: true,
                                size: 22,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    // Đã đổi sang keepNext để giữ liền khối chữ ký trên cùng 1 trang
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        keepNext: true,
                        children: [
                            new TextRun({
                                text: toNFD(signDateStr),
                                italics: true,
                                size: 22,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        keepNext: true,
                        spacing: { before: 60, after: 1200 },
                        children: [
                            new TextRun({
                                text: toNFD("HLV Trưởng     "),
                                bold: true,
                                size: 22,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({
                                text: toNFD("Thầy : Nguyễn Trần Anh Vũ  "),
                                bold: true,
                                size: 22,
                                font: "Calibri",
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Bang_Diem_Ket_Qua_Thi_${dayStr}-${monthStr}-${yearStr}.docx`);
}

function createCell(
    text: string,
    width: number,
    align: (typeof AlignmentType)[keyof typeof AlignmentType],
    isHeader = false,
    isBold = false,
    isItalic = false
) {
    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        },
        children: [
            new Paragraph({
                alignment: align,
                children: [
                    new TextRun({
                        text: text,
                        bold: isHeader || isBold,
                        italics: isItalic,
                        size: isHeader ? 21 : 20,
                        font: "Calibri",
                    }),
                ],
            }),
        ],
    });
}

function createRankCell(
    text: string,
    width: number,
    mergeType?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType]
) {
    const lines = text.split("\n");

    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        verticalMerge: mergeType,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        },
        children: lines.map(
            (line) =>
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: toNFD(line),
                            bold: false,
                            size: 20,
                            font: "Calibri",
                        }),
                    ],
                })
        ),
    });
}
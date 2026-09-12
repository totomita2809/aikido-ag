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
} from "docx";
import { saveAs } from "file-saver";

interface ExaminerData {
    order: number;
    fullName: string;
    rank: string;
    role: string;
}

interface CandidateData {
    order: number;
    fullName: string;
    dob: string;
    targetRank: string;
}

function toNFD(str: string): string {
    return str ? str.normalize("NFD") : "";
}

export async function generateExamDocx(
    examDateStr: string,
    examiners: ExaminerData[],
    candidates: CandidateData[]
) {
    const sortedExaminers = [...examiners].sort((a, b) => a.order - b.order);

    const examinerRows = [
        new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
                createHeaderCell("STT", 700),
                createHeaderCell("HỌ VÀ TÊN", 3800),
                createHeaderCell("CẤP ĐAI", 2500),
                createHeaderCell("VAI TRÒ CHẤM THI", 2500),
            ],
        }),
        ...sortedExaminers.map(
            (ex, index) =>
                new TableRow({
                    cantSplit: true,
                    children: [
                        createBodyCell(String(index + 1), 700, AlignmentType.CENTER),
                        createBodyCell(toNFD(ex.fullName), 3800, AlignmentType.LEFT),
                        createBodyCell(toNFD(ex.rank), 2500, AlignmentType.CENTER),
                        createBodyCell(toNFD(ex.role), 2500, AlignmentType.CENTER),
                    ],
                })
        ),
    ];

    const candidateRows = [
        new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
                createHeaderCell("STT", 600),
                createHeaderCell("HỌ VÀ TÊN", 2800),
                createHeaderCell("NĂM SINH", 1600),
                createHeaderCell("LÊN ĐAI", 2000),
                createHeaderCell("ĐIỂM 5", 800),
                createHeaderCell("ĐIỂM 6", 800),
                createHeaderCell("ĐIỂM 7", 800),
                createHeaderCell("ĐIỂM 8", 800),
                createHeaderCell("ĐIỂM 9", 800),
                createHeaderCell("ĐIỂM 10", 800),
                createHeaderCell("NHẬN XÉT", 3400),
            ],
        }),
        ...candidates.map(
            (c, index) =>
                new TableRow({
                    cantSplit: true,
                    height: { value: 600, rule: HeightRule.ATLEAST },
                    children: [
                        createBodyCell(String(index + 1), 600, AlignmentType.CENTER),
                        createBodyCell(toNFD(c.fullName), 2800, AlignmentType.LEFT),
                        createBodyCell(c.dob, 1600, AlignmentType.LEFT),
                        createBodyCell(toNFD(c.targetRank), 2000, AlignmentType.CENTER),
                        createBodyCell("", 800, AlignmentType.CENTER),
                        createBodyCell("", 800, AlignmentType.CENTER),
                        createBodyCell("", 800, AlignmentType.CENTER),
                        createBodyCell("", 800, AlignmentType.CENTER),
                        createBodyCell("", 800, AlignmentType.CENTER),
                        createBodyCell("", 800, AlignmentType.CENTER),
                        createBodyCell("", 3400, AlignmentType.LEFT),
                    ],
                })
        ),
    ];

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            orientation: PageOrientation.LANDSCAPE,
                        },
                        margin: {
                            top: 720,
                            bottom: 720,
                            left: 720,
                            right: 720,
                        },
                    },
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: toNFD("BỘ MÔN VÕ AIKIDO"),
                                bold: true,
                                size: 24,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 80, after: 120 },
                        children: [
                            new TextRun({
                                text: toNFD("PHIẾU CHẤM THI THĂNG ĐAI"),
                                bold: true,
                                size: 32,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: toNFD(examDateStr),
                                italics: true,
                                size: 22,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Paragraph({
                        spacing: { after: 100 },
                        children: [
                            new TextRun({
                                text: toNFD("Ban chấm thi:"),
                                bold: true,
                                size: 22,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Table({
                        rows: examinerRows,
                    }),
                    new Paragraph({
                        spacing: { before: 250, after: 100 },
                        children: [
                            new TextRun({
                                text: toNFD(
                                    "( Lưu ý : Nếu điểm tròn thì đánh dấu X hoặc ✓ , nếu là điểm phẩy thì ghi cụ thể )"
                                ),
                                italics: true,
                                size: 20,
                                font: "Calibri",
                            }),
                        ],
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: candidateRows,
                    }),
                    new Paragraph({
                        spacing: { before: 350 },
                        children: [
                            new TextRun({
                                text: toNFD("NHẬN XÉT CHUNG :"),
                                underline: {},
                                bold: true,
                                italics: true,
                                size: 22,
                                font: "Calibri",
                            }),
                            new TextRun({
                                text: "\t\t\t\t\t\t\t\t\t\t\t\t" + toNFD("CHỮ KÍ XÁC NHẬN CỦA HLV CHẤM THI"),
                                bold: true,
                                italics: true,
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
    saveAs(blob, `Phieu_Cham_Thi_Thang_Dai_${new Date().toISOString().split("T")[0]}.docx`);
}

function createHeaderCell(text: string, width: number) {
    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: toNFD(text),
                        bold: true,
                        size: 20,
                        font: "Calibri",
                    }),
                ],
            }),
        ],
    });
}

function createBodyCell(text: string, width: number, align: (typeof AlignmentType)[keyof typeof AlignmentType]) {
    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 120, bottom: 120, left: 100, right: 100 },
        children: [
            new Paragraph({
                alignment: align,
                children: [
                    new TextRun({
                        text: text,
                        size: 20,
                        font: "Calibri",
                    }),
                ],
            }),
        ],
    });
}
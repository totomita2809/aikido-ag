export function exportToCSV(csvContent: string, filename: string) {
    if (!csvContent || csvContent.trim() === "") {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    // Thêm BOM (\uFEFF) để Excel nhận diện chuẩn tiếng Việt UTF-8
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
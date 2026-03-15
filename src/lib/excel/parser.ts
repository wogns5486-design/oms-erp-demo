import * as XLSX from "xlsx";

export interface ParsedSheet {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

export function parseExcelFile(file: File): Promise<ParsedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const results: ParsedSheet[] = [];

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            worksheet,
            { defval: "" }
          );
          const headers =
            jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
          results.push({
            fileName: file.name,
            sheetName,
            headers,
            rows: jsonData,
          });
        }

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsArrayBuffer(file);
  });
}

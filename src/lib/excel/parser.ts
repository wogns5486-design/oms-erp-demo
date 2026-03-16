import * as XLSX from "xlsx";

export interface ParsedSheet {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

/**
 * XLSX 워크북 객체를 ParsedSheet 배열로 변환하는 내부 헬퍼 함수.
 * parseExcelFile, parseExcelBuffer 양쪽에서 공통으로 사용됩니다.
 */
function parseWorkbook(workbook: XLSX.WorkBook, fileName: string): ParsedSheet[] {
  const results: ParsedSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      worksheet,
      { defval: "" }
    );
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
    results.push({ fileName, sheetName, headers, rows: jsonData });
  }

  return results;
}

/**
 * 브라우저 File 객체로부터 엑셀 데이터를 비동기적으로 파싱합니다.
 * 프론트엔드 환경(FileReader API)에서 사용합니다.
 *
 * @param file - 브라우저 File 객체
 * @returns 시트별 파싱 결과 배열을 담은 Promise
 */
export function parseExcelFile(file: File): Promise<ParsedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        resolve(parseWorkbook(workbook, file.name));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Node.js Buffer로부터 엑셀 데이터를 동기적으로 파싱합니다.
 * 서버사이드(API Route, Server Action 등) 환경에서 사용합니다.
 *
 * @param buffer - 엑셀 파일 내용을 담은 Node.js Buffer
 * @param fileName - 결과에 포함될 파일명
 * @returns 시트별 파싱 결과 배열
 */
export function parseExcelBuffer(buffer: Buffer, fileName: string): ParsedSheet[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return parseWorkbook(workbook, fileName);
}

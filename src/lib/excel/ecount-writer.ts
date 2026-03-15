import * as XLSX from "xlsx";
import type { EcountOutputRow } from "@/lib/types";

export function downloadEcountExcel(
  rows: EcountOutputRow[],
  fileName: string = "이카운트_변환결과"
) {
  const exportData = rows.map((r) => ({
    거래처코드: r.customerCode,
    거래처명: r.customerName,
    품목코드: r.itemCode,
    품명: r.itemName,
    규격: r.spec,
    수량: r.quantity,
    단가: r.unitPrice,
    공급가액: r.supplyAmount,
    비고: r.remark,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "이카운트");

  // Set column widths
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
  ];

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function downloadUnmappedExcel(
  rows: EcountOutputRow[],
  fileName: string = "미매핑_오류목록"
) {
  const unmapped = rows.filter((r) => r._unmapped);
  const exportData = unmapped.map((r) => ({
    거래처코드: r.customerCode || "(미매핑)",
    거래처명: r.customerName,
    품목코드: r.itemCode || "(미매핑)",
    품명: r.itemName,
    오류유형:
      r._unmappedField === "both"
        ? "거래처+품목 미매핑"
        : r._unmappedField === "customer"
        ? "거래처 미매핑"
        : "품목 미매핑",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "미매핑목록");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

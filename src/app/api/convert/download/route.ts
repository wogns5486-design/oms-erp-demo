import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import type { EcountOutputRow } from "@/lib/types";
import { error } from "@/lib/api/response";

/**
 * POST /api/convert/download
 * 변환 결과를 이카운트 ERP 엑셀 파일로 다운로드
 * body: { rows: EcountOutputRow[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows: EcountOutputRow[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return error("rows 가 비어 있거나 올바르지 않습니다.");
    }

    // 내부 필드(_unmapped, _unmappedField) 제거 후 시트 데이터 생성
    const sheetData = rows.map((r) => ({
      거래처코드: r.customerCode,
      거래처명: r.customerName,
      품목코드: r.itemCode,
      품목명: r.itemName,
      규격: r.spec,
      수량: r.quantity,
      단가: r.unitPrice,
      공급가액: r.supplyAmount,
      비고: r.remark,
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "이카운트수주");

    const xlsxBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    return new Response(xlsxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ecount_order.xlsx"`,
      },
    });
  } catch (e) {
    console.error("[POST /api/convert/download]", e);
    return error("엑셀 다운로드 중 오류가 발생했습니다.", 500);
  }
}

import { NextRequest } from "next/server";
import * as customerRepo from "@/lib/db/repositories/customer-repo";
import * as productRepo from "@/lib/db/repositories/product-repo";
import * as conversionLogRepo from "@/lib/db/repositories/conversion-log-repo";
import { parseExcelBuffer } from "@/lib/excel/parser";
import { identifyChain } from "@/lib/excel/chain-identifier";
import { transformToEcount } from "@/lib/excel/ecount-transformer";
import { ok, error } from "@/lib/api/response";

/**
 * POST /api/convert/upload
 * 엑셀 파일 업로드 후 파싱 및 이카운트 ERP 형식으로 변환
 * FormData: file (엑셀 파일)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return error("file 필드가 없거나 올바르지 않습니다.");
    }

    const fileName =
      file instanceof File ? file.name : "upload.xlsx";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sheets = parseExcelBuffer(buffer, fileName);
    if (sheets.length === 0) {
      return error("파싱 가능한 시트가 없습니다.");
    }

    const sheet = sheets[0];
    const chain = identifyChain(sheet);

    const rows = transformToEcount(sheet, chain, {
      findCustomer: (name) => customerRepo.findByOmsName(name),
      findProduct: (name) => productRepo.findByOmsName(name),
    });

    const unmappedCount = rows.filter((r) => r._unmapped).length;

    conversionLogRepo.create(
      {
        fileName,
        chain,
        totalRows: rows.length,
        unmappedCount,
      },
      rows
    );

    return ok({
      chain,
      totalRows: rows.length,
      unmappedCount,
      rows,
    });
  } catch (e) {
    console.error("[POST /api/convert/upload]", e);
    return error("파일 변환 중 오류가 발생했습니다.", 500);
  }
}

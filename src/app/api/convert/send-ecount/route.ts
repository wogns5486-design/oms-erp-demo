import { NextRequest } from "next/server";
import { createEcountApi } from "@/lib/external/ecount";
import type { EcountSalesRow } from "@/lib/external/ecount";
import { ok, error } from "@/lib/api/response";

/**
 * POST /api/convert/send-ecount
 * 이카운트 ERP로 수주 데이터 전송 (mock)
 * body: { rows: EcountSalesRow[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows: EcountSalesRow[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return error("rows 가 비어 있거나 올바르지 않습니다.");
    }

    const api = createEcountApi();

    const companyCode = process.env.ECOUNT_COMPANY_CODE ?? "TEST";
    const userId = process.env.ECOUNT_USER_ID ?? "test";
    const password = process.env.ECOUNT_PASSWORD ?? "test";

    const session = await api.login(companyCode, userId, password);
    const result = await api.uploadSalesOrder(session, rows);

    return ok(result);
  } catch (e) {
    console.error("[POST /api/convert/send-ecount]", e);
    return error("이카운트 ERP 전송 중 오류가 발생했습니다.", 500);
  }
}

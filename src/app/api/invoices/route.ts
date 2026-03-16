import { NextRequest } from "next/server";
import * as invoiceRepo from "@/lib/db/repositories/invoice-repo";
import { paginated, error } from "@/lib/api/response";

/**
 * GET /api/invoices
 * 송장 목록 조회
 * query params: status, page(기본1), size(기본50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const size = Number(searchParams.get("size") ?? "50");

    const { data, total } = invoiceRepo.findAll({ status, page, size });
    return paginated(data, total, page, size);
  } catch (e) {
    console.error("[GET /api/invoices]", e);
    return error("송장 목록 조회 중 오류가 발생했습니다.", 500);
  }
}

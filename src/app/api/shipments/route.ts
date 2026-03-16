import { NextRequest } from "next/server";
import * as shipmentRepo from "@/lib/db/repositories/shipment-repo";
import { ok, error } from "@/lib/api/response";

/**
 * GET /api/shipments
 * 날짜별 출고 목록 조회
 * query params: date (필수, YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get("date");

    if (!date) {
      return error("date 파라미터는 필수입니다.");
    }

    const shipments = shipmentRepo.findByDate(date);
    return ok(shipments);
  } catch (e) {
    console.error("[GET /api/shipments]", e);
    return error("출고 목록 조회 중 오류가 발생했습니다.", 500);
  }
}

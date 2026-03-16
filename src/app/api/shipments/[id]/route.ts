import { NextRequest } from "next/server";
import * as shipmentRepo from "@/lib/db/repositories/shipment-repo";
import { ok, error } from "@/lib/api/response";

/**
 * GET /api/shipments/[id]
 * 출고 상세 조회 (items 포함)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shipment = shipmentRepo.findById(id);

    if (!shipment) {
      return error("출고를 찾을 수 없습니다.", 404);
    }

    return ok(shipment);
  } catch (e) {
    console.error("[GET /api/shipments/[id]]", e);
    return error("출고 조회 중 오류가 발생했습니다.", 500);
  }
}

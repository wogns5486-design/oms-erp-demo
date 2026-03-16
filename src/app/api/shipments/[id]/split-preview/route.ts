import { NextRequest } from "next/server";
import * as shipmentRepo from "@/lib/db/repositories/shipment-repo";
import * as settingsRepo from "@/lib/db/repositories/settings-repo";
import { splitBoxes } from "@/lib/shipping/box-splitter";
import { ok, error } from "@/lib/api/response";

/**
 * GET /api/shipments/[id]/split-preview
 * 박스 분할 미리보기
 * 출고 품목을 박스 포장 기준에 따라 분할한 결과를 반환
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

    const boxStandards = settingsRepo.getBoxStandards();

    const result = splitBoxes({
      recipientName: shipment.recipientName,
      items: shipment.items,
      boxStandards,
    });

    return ok(result);
  } catch (e) {
    console.error("[GET /api/shipments/[id]/split-preview]", e);
    return error("박스 분할 미리보기 중 오류가 발생했습니다.", 500);
  }
}

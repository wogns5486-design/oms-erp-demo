import { NextRequest } from "next/server";
import * as productRepo from "@/lib/db/repositories/product-repo";
import { ok, error } from "@/lib/api/response";

/**
 * PUT /api/products/bulk
 * 품목 일괄 매핑 수정. body: { updates: [{ id, ecountItemCode }] }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return error("updates 배열이 필요합니다.");
    }

    for (const item of updates) {
      if (!item.id || !item.ecountItemCode) {
        return error("각 항목에 id 와 ecountItemCode 가 필요합니다.");
      }
    }

    const count = productRepo.bulkUpdate(updates);
    return ok({ updated: count });
  } catch (e) {
    console.error("[PUT /api/products/bulk]", e);
    return error("품목 일괄 수정 중 오류가 발생했습니다.", 500);
  }
}

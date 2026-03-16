import { NextRequest } from "next/server";
import * as customerRepo from "@/lib/db/repositories/customer-repo";
import { ok, error } from "@/lib/api/response";

/**
 * PUT /api/customers/bulk
 * 거래처 일괄 매핑 수정. body: { updates: [{ id, ecountCode }] }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return error("updates 배열이 필요합니다.");
    }

    for (const item of updates) {
      if (!item.id || !item.ecountCode) {
        return error("각 항목에 id 와 ecountCode 가 필요합니다.");
      }
    }

    const count = customerRepo.bulkUpdate(updates);
    return ok({ updated: count });
  } catch (e) {
    console.error("[PUT /api/customers/bulk]", e);
    return error("거래처 일괄 수정 중 오류가 발생했습니다.", 500);
  }
}

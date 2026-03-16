import { NextRequest } from "next/server";
import * as settingsRepo from "@/lib/db/repositories/settings-repo";
import { ok, error } from "@/lib/api/response";

/**
 * GET /api/settings/box-standards
 * 모든 박스 포장 기준 조회
 */
export async function GET(_request: NextRequest) {
  try {
    const standards = settingsRepo.getBoxStandards();
    return ok(standards);
  } catch (e) {
    console.error("[GET /api/settings/box-standards]", e);
    return error("박스 포장 기준 조회 중 오류가 발생했습니다.", 500);
  }
}

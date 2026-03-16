import { NextRequest } from "next/server";
import * as settingsRepo from "@/lib/db/repositories/settings-repo";
import { ok, error } from "@/lib/api/response";

/**
 * PUT /api/settings/box-standards/[id]
 * 박스 포장 기준 수정. body: { maxPerBox }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { maxPerBox } = body;

    if (maxPerBox === undefined || maxPerBox === null) {
      return error("maxPerBox 는 필수 항목입니다.");
    }

    const parsed = Number(maxPerBox);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return error("maxPerBox 는 1 이상의 정수이어야 합니다.");
    }

    const updated = settingsRepo.updateBoxStandard(id, parsed);
    if (!updated) {
      return error("해당 박스 포장 기준을 찾을 수 없습니다.", 404);
    }

    return ok({ success: true });
  } catch (e) {
    console.error("[PUT /api/settings/box-standards/[id]]", e);
    return error("박스 포장 기준 수정 중 오류가 발생했습니다.", 500);
  }
}

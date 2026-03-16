import { NextRequest } from "next/server";
import * as customerRepo from "@/lib/db/repositories/customer-repo";
import { ok, error } from "@/lib/api/response";

/**
 * PUT /api/customers/[id]
 * 거래처 수정. body에서 변경할 필드만 전달
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { omsName, ecountCode, ecountName, chain } = body;

    const updated = customerRepo.update(id, { omsName, ecountCode, ecountName, chain });
    if (!updated) {
      return error("해당 거래처를 찾을 수 없습니다.", 404);
    }
    return ok(updated);
  } catch (e) {
    console.error("[PUT /api/customers/[id]]", e);
    return error("거래처 수정 중 오류가 발생했습니다.", 500);
  }
}

/**
 * DELETE /api/customers/[id]
 * 거래처 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = customerRepo.remove(id);
    if (!deleted) {
      return error("해당 거래처를 찾을 수 없습니다.", 404);
    }
    return ok({ success: true });
  } catch (e) {
    console.error("[DELETE /api/customers/[id]]", e);
    return error("거래처 삭제 중 오류가 발생했습니다.", 500);
  }
}

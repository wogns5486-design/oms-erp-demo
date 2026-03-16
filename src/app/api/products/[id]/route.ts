import { NextRequest } from "next/server";
import * as productRepo from "@/lib/db/repositories/product-repo";
import { ok, error } from "@/lib/api/response";

/**
 * PUT /api/products/[id]
 * 품목 수정. body에서 변경할 필드만 전달
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { omsProductName, ecountItemCode, ecountItemName, spec, unitPrice, category } = body;

    const updated = productRepo.update(id, {
      omsProductName,
      ecountItemCode,
      ecountItemName,
      spec,
      unitPrice,
      category,
    });
    if (!updated) {
      return error("해당 품목을 찾을 수 없습니다.", 404);
    }
    return ok(updated);
  } catch (e) {
    console.error("[PUT /api/products/[id]]", e);
    return error("품목 수정 중 오류가 발생했습니다.", 500);
  }
}

/**
 * DELETE /api/products/[id]
 * 품목 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = productRepo.remove(id);
    if (!deleted) {
      return error("해당 품목을 찾을 수 없습니다.", 404);
    }
    return ok({ success: true });
  } catch (e) {
    console.error("[DELETE /api/products/[id]]", e);
    return error("품목 삭제 중 오류가 발생했습니다.", 500);
  }
}

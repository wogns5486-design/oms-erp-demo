import { NextRequest } from "next/server";
import * as invoiceRepo from "@/lib/db/repositories/invoice-repo";
import { ok, error } from "@/lib/api/response";

/**
 * POST /api/invoices/[id]/cancel
 * 송장 취소
 * [id] 는 invoiceNumber
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const success = invoiceRepo.cancelInvoice(id);

    if (!success) {
      return error("송장을 찾을 수 없습니다.", 404);
    }

    return ok({ cancelled: true, invoiceNumber: id });
  } catch (e) {
    console.error("[POST /api/invoices/[id]/cancel]", e);
    return error("송장 취소 중 오류가 발생했습니다.", 500);
  }
}

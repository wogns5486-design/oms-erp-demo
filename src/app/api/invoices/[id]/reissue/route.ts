import { NextRequest } from "next/server";
import * as invoiceRepo from "@/lib/db/repositories/invoice-repo";
import { ok, error } from "@/lib/api/response";

/**
 * POST /api/invoices/[id]/reissue
 * 송장 재발행
 * body: { shipmentId: string, invoiceNumber: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { shipmentId, invoiceNumber } = body as {
      shipmentId: string;
      invoiceNumber: string;
    };

    if (!shipmentId || !invoiceNumber) {
      return error("shipmentId 와 invoiceNumber 는 필수 항목입니다.");
    }

    // id 파라미터는 invoice id (invoiceNumber와 동일하게 사용 가능)
    // body의 invoiceNumber를 우선 사용
    const targetInvoiceNumber = invoiceNumber || id;

    const newInvoiceNumber = invoiceRepo.reissueInvoice(
      shipmentId,
      targetInvoiceNumber
    );

    return ok({ newInvoiceNumber });
  } catch (e) {
    console.error("[POST /api/invoices/[id]/reissue]", e);
    const message =
      e instanceof Error ? e.message : "송장 재발행 중 오류가 발생했습니다.";
    return error(message, 500);
  }
}

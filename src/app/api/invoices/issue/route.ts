import { NextRequest } from "next/server";
import * as shipmentRepo from "@/lib/db/repositories/shipment-repo";
import * as invoiceRepo from "@/lib/db/repositories/invoice-repo";
import * as settingsRepo from "@/lib/db/repositories/settings-repo";
import { splitBoxes } from "@/lib/shipping/box-splitter";
import { ok, error } from "@/lib/api/response";

/**
 * POST /api/invoices/issue
 * 송장 일괄 발행
 * body: { shipmentIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentIds } = body as { shipmentIds: string[] };

    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return error("shipmentIds 가 비어 있거나 올바르지 않습니다.");
    }

    const boxStandards = settingsRepo.getBoxStandards();
    let totalIssued = 0;
    const results: { shipmentId: string; invoiceNumbers: string[] }[] = [];

    for (const shipmentId of shipmentIds) {
      const shipment = shipmentRepo.findById(shipmentId);
      if (!shipment) {
        continue;
      }

      const splitResult = splitBoxes({
        recipientName: shipment.recipientName,
        items: shipment.items,
        boxStandards,
      });

      const boxes = splitResult.boxes.map((box) => ({
        boxNumber: box.boxNumber,
        items: box.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
        })),
      }));

      const invoiceNumbers = invoiceRepo.issueInvoice(shipmentId, boxes);
      totalIssued += invoiceNumbers.length;
      results.push({ shipmentId, invoiceNumbers });
    }

    return ok({ totalIssued, results });
  } catch (e) {
    console.error("[POST /api/invoices/issue]", e);
    return error("송장 발행 중 오류가 발생했습니다.", 500);
  }
}

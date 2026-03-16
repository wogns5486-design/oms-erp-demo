import { getDb } from "../connection";
import type { InvoiceRecord } from "@/lib/types";

interface InvoiceWithContext extends InvoiceRecord {
  shipmentId: string;
  recipientName: string;
  customerName: string;
}

/** DB 행을 InvoiceRecord로 변환 */
function toModel(row: Record<string, unknown>): InvoiceWithContext {
  const db = getDb();
  const items = db
    .prepare("SELECT item_name, quantity FROM invoice_items WHERE invoice_id = ?")
    .all(row.id as number) as { item_name: string; quantity: number }[];

  return {
    invoiceNumber: row.invoice_number as string,
    status: row.status as InvoiceRecord["status"],
    issuedAt: row.issued_at as string,
    boxNumber: row.box_number as number,
    items: items.map((i) => ({ itemName: i.item_name, quantity: i.quantity })),
    shipmentId: row.shipment_id as string,
    recipientName: row.recipient_name as string,
    customerName: row.customer_name as string,
  };
}

/** 송장 목록 조회 (상태 필터) */
export function findAll(options?: {
  status?: string;
  page?: number;
  size?: number;
}): { data: InvoiceWithContext[]; total: number } {
  const db = getDb();
  const { status, page = 1, size = 50 } = options ?? {};
  const offset = (page - 1) * size;

  let where = "";
  const params: unknown[] = [];
  if (status && status !== "all") {
    where = "WHERE i.status = ?";
    params.push(status);
  }

  const total = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM invoices i ${where}`
    )
    .get(...params) as { cnt: number };

  const rows = db
    .prepare(
      `SELECT i.*, s.recipient_name, s.customer_name
       FROM invoices i
       JOIN shipments s ON s.id = i.shipment_id
       ${where}
       ORDER BY i.issued_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, size, offset) as Record<string, unknown>[];

  return { data: rows.map(toModel), total: total.cnt };
}

/** 출고 ID로 송장 조회 */
export function findByShipment(shipmentId: string): InvoiceWithContext[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT i.*, s.recipient_name, s.customer_name
       FROM invoices i
       JOIN shipments s ON s.id = i.shipment_id
       WHERE i.shipment_id = ?
       ORDER BY i.box_number`
    )
    .all(shipmentId) as Record<string, unknown>[];
  return rows.map(toModel);
}

/** 송장번호로 조회 */
export function findByNumber(invoiceNumber: string): InvoiceWithContext | undefined {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT i.*, s.recipient_name, s.customer_name
       FROM invoices i
       JOIN shipments s ON s.id = i.shipment_id
       WHERE i.invoice_number = ?`
    )
    .get(invoiceNumber) as Record<string, unknown> | undefined;
  return row ? toModel(row) : undefined;
}

/** 다음 송장번호 시퀀스 가져오기 (일별) */
export function getNextSeq(date: string): number {
  const db = getDb();
  const row = db
    .prepare("SELECT seq FROM invoice_sequence WHERE date = ?")
    .get(date) as { seq: number } | undefined;

  const nextSeq = (row?.seq ?? 0) + 1;

  db.prepare(
    `INSERT INTO invoice_sequence (date, seq) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET seq = ?`
  ).run(date, nextSeq, nextSeq);

  return nextSeq;
}

/** 송장번호 생성 (LOGEN-YYYYMMDD-NNNNN) */
export function generateInvoiceNumber(date: string): string {
  const seq = getNextSeq(date);
  const dateStr = date.replace(/-/g, "");
  return `LOGEN-${dateStr}-${String(seq).padStart(5, "0")}`;
}

/** 송장 발행 (트랜잭션) */
export function issueInvoice(
  shipmentId: string,
  boxes: { boxNumber: number; items: { itemName: string; quantity: number }[] }[]
): string[] {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const invoiceNumbers: string[] = [];

  const run = db.transaction(() => {
    for (const box of boxes) {
      const invoiceNumber = generateInvoiceNumber(today);
      invoiceNumbers.push(invoiceNumber);

      const result = db
        .prepare(
          `INSERT INTO invoices (shipment_id, invoice_number, status, box_number, issued_at)
           VALUES (?, ?, 'active', ?, datetime('now'))`
        )
        .run(shipmentId, invoiceNumber, box.boxNumber);

      const invoiceId = result.lastInsertRowid;
      const itemStmt = db.prepare(
        "INSERT INTO invoice_items (invoice_id, item_name, quantity) VALUES (?, ?, ?)"
      );
      for (const item of box.items) {
        itemStmt.run(invoiceId, item.itemName, item.quantity);
      }
    }

    db.prepare("UPDATE shipments SET status = 'invoiced' WHERE id = ?").run(
      shipmentId
    );
  });

  run();
  return invoiceNumbers;
}

/** 송장 재발행 */
export function reissueInvoice(
  shipmentId: string,
  oldInvoiceNumber: string
): string {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  let newNumber = "";

  const run = db.transaction(() => {
    const oldInv = db
      .prepare("SELECT * FROM invoices WHERE invoice_number = ?")
      .get(oldInvoiceNumber) as Record<string, unknown> | undefined;
    if (!oldInv) throw new Error("송장을 찾을 수 없습니다.");

    db.prepare(
      "UPDATE invoices SET status = 'reissued' WHERE invoice_number = ?"
    ).run(oldInvoiceNumber);

    newNumber = generateInvoiceNumber(today);

    const result = db
      .prepare(
        `INSERT INTO invoices (shipment_id, invoice_number, status, box_number, issued_at)
         VALUES (?, ?, 'active', ?, datetime('now'))`
      )
      .run(shipmentId, newNumber, oldInv.box_number);

    const newInvoiceId = result.lastInsertRowid;
    const oldItems = db
      .prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
      .all(oldInv.id as number) as { item_name: string; quantity: number }[];

    const itemStmt = db.prepare(
      "INSERT INTO invoice_items (invoice_id, item_name, quantity) VALUES (?, ?, ?)"
    );
    for (const item of oldItems) {
      itemStmt.run(newInvoiceId, item.item_name, item.quantity);
    }
  });

  run();
  return newNumber;
}

/** 송장 취소 */
export function cancelInvoice(invoiceNumber: string): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE invoices SET status = 'cancelled' WHERE invoice_number = ?")
    .run(invoiceNumber);
  return result.changes > 0;
}

/** 특정 날짜의 송장 발행 수 */
export function countByDate(date: string): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM invoices WHERE date(issued_at) = ?"
    )
    .get(date) as { cnt: number };
  return row.cnt;
}

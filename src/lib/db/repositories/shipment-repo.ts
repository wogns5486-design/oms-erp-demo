import { getDb } from "../connection";
import type { Shipment, ShipmentItem } from "@/lib/types";

/** DB 행을 Shipment 모델로 변환 (items 별도 조회 필요) */
function toModel(row: Record<string, unknown>, items: ShipmentItem[]): Shipment {
  return {
    id: row.id as string,
    date: row.date as string,
    customerCode: row.customer_code as string,
    customerName: row.customer_name as string,
    recipientName: row.recipient_name as string,
    recipientPhone: row.recipient_phone as string,
    recipientAddress: row.recipient_address as string,
    status: row.status as Shipment["status"],
    items,
    invoices: [],
  };
}

/** DB 행을 ShipmentItem으로 변환 */
function toItem(row: Record<string, unknown>): ShipmentItem {
  return {
    itemCode: row.item_code as string,
    itemName: row.item_name as string,
    quantity: row.quantity as number,
    spec: row.spec as string,
    category: row.category as string,
  };
}

/** 출고의 품목 목록 조회 */
function getItems(shipmentId: string): ShipmentItem[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM shipment_items WHERE shipment_id = ?")
    .all(shipmentId) as Record<string, unknown>[];
  return rows.map(toItem);
}

/** 날짜별 출고 목록 조회 (품목 포함) */
export function findByDate(date: string): Shipment[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM shipments WHERE date = ? ORDER BY created_at")
    .all(date) as Record<string, unknown>[];
  return rows.map((r) => toModel(r, getItems(r.id as string)));
}

/** 날짜별 대기 중인 출고 목록 */
export function findPendingByDate(date: string): Shipment[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM shipments WHERE date = ? AND status = 'pending' ORDER BY created_at"
    )
    .all(date) as Record<string, unknown>[];
  return rows.map((r) => toModel(r, getItems(r.id as string)));
}

/** ID로 출고 조회 (품목 포함) */
export function findById(id: string): Shipment | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM shipments WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) return undefined;
  return toModel(row, getItems(id));
}

/** 출고 상태 변경 */
export function updateStatus(
  id: string,
  status: Shipment["status"]
): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE shipments SET status = ? WHERE id = ?")
    .run(status, id);
  return result.changes > 0;
}

/** 출고 데이터 생성 (품목 포함, 트랜잭션) */
export function create(data: {
  id: string;
  date: string;
  customerCode: string;
  customerName: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  items: Omit<ShipmentItem, "">[];
}): Shipment {
  const db = getDb();
  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO shipments (id, date, customer_code, customer_name, recipient_name, recipient_phone, recipient_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      data.id,
      data.date,
      data.customerCode,
      data.customerName,
      data.recipientName,
      data.recipientPhone,
      data.recipientAddress
    );

    const itemStmt = db.prepare(
      `INSERT INTO shipment_items (shipment_id, item_code, item_name, quantity, spec, category)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const item of data.items) {
      itemStmt.run(
        data.id,
        item.itemCode,
        item.itemName,
        item.quantity,
        item.spec,
        item.category
      );
    }
  });
  run();
  return findById(data.id)!;
}

/** 특정 날짜의 출고 건수 */
export function countByDate(date: string): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) as cnt FROM shipments WHERE date = ?")
    .get(date) as { cnt: number };
  return row.cnt;
}

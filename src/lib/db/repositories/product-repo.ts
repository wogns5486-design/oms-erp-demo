import { getDb } from "../connection";
import type { ProductMapping } from "@/lib/types";
import { randomUUID } from "crypto";

/** snake_case DB 행을 camelCase ProductMapping으로 변환 */
function toModel(row: Record<string, unknown>): ProductMapping {
  return {
    id: row.id as string,
    omsProductName: row.oms_product_name as string,
    ecountItemCode: row.ecount_item_code as string,
    ecountItemName: row.ecount_item_name as string,
    spec: row.spec as string,
    unitPrice: row.unit_price as number,
    category: row.category as ProductMapping["category"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** 품목 목록 조회 (검색, 페이지네이션) */
export function findAll(options?: {
  search?: string;
  page?: number;
  size?: number;
}): { data: ProductMapping[]; total: number } {
  const db = getDb();
  const { search, page = 1, size = 20 } = options ?? {};
  const offset = (page - 1) * size;

  let where = "";
  const params: unknown[] = [];

  if (search) {
    where =
      "WHERE oms_product_name LIKE ? OR ecount_item_code LIKE ? OR ecount_item_name LIKE ?";
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  const total = db
    .prepare(`SELECT COUNT(*) as cnt FROM products ${where}`)
    .get(...params) as { cnt: number };

  const rows = db
    .prepare(
      `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, size, offset) as Record<string, unknown>[];

  return { data: rows.map(toModel), total: total.cnt };
}

/** OMS 품목명으로 매핑 검색 (정확 매칭 우선, 부분 매칭 fallback) */
export function findByOmsName(name: string): ProductMapping | undefined {
  const db = getDb();
  const exact = db
    .prepare("SELECT * FROM products WHERE oms_product_name = ?")
    .get(name) as Record<string, unknown> | undefined;
  if (exact) return toModel(exact);

  const partial = db
    .prepare("SELECT * FROM products WHERE oms_product_name LIKE ? LIMIT 1")
    .get(`%${name}%`) as Record<string, unknown> | undefined;
  return partial ? toModel(partial) : undefined;
}

/** ID로 품목 조회 */
export function findById(id: string): ProductMapping | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? toModel(row) : undefined;
}

/** 품목 추가 */
export function create(data: {
  omsProductName: string;
  ecountItemCode: string;
  ecountItemName: string;
  spec: string;
  unitPrice: number;
  category: ProductMapping["category"];
}): ProductMapping {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO products (id, oms_product_name, ecount_item_code, ecount_item_name, spec, unit_price, category, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.omsProductName,
    data.ecountItemCode,
    data.ecountItemName,
    data.spec,
    data.unitPrice,
    data.category,
    now,
    now
  );
  return findById(id)!;
}

/** 품목 수정 */
export function update(
  id: string,
  data: Partial<{
    omsProductName: string;
    ecountItemCode: string;
    ecountItemName: string;
    spec: string;
    unitPrice: number;
    category: ProductMapping["category"];
  }>
): ProductMapping | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.omsProductName !== undefined) {
    fields.push("oms_product_name = ?");
    values.push(data.omsProductName);
  }
  if (data.ecountItemCode !== undefined) {
    fields.push("ecount_item_code = ?");
    values.push(data.ecountItemCode);
  }
  if (data.ecountItemName !== undefined) {
    fields.push("ecount_item_name = ?");
    values.push(data.ecountItemName);
  }
  if (data.spec !== undefined) {
    fields.push("spec = ?");
    values.push(data.spec);
  }
  if (data.unitPrice !== undefined) {
    fields.push("unit_price = ?");
    values.push(data.unitPrice);
  }
  if (data.category !== undefined) {
    fields.push("category = ?");
    values.push(data.category);
  }

  if (fields.length === 0) return findById(id);

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
  return findById(id);
}

/** 품목 삭제 */
export function remove(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return result.changes > 0;
}

/** 미매핑 품목 목록 */
export function getUnmapped(): ProductMapping[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM products WHERE ecount_item_code = '' ORDER BY oms_product_name"
    )
    .all() as Record<string, unknown>[];
  return rows.map(toModel);
}

/** 일괄 매핑 수정 */
export function bulkUpdate(
  updates: { id: string; ecountItemCode: string }[]
): number {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    "UPDATE products SET ecount_item_code = ?, updated_at = ? WHERE id = ?"
  );
  const run = db.transaction(() => {
    let count = 0;
    for (const { id, ecountItemCode } of updates) {
      const result = stmt.run(ecountItemCode, now, id);
      count += result.changes;
    }
    return count;
  });
  return run();
}

/** 전체 품목 수 */
export function count(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as cnt FROM products").get() as {
    cnt: number;
  };
  return row.cnt;
}

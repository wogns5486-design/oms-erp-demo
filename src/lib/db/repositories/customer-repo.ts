import { getDb } from "../connection";
import type { CustomerMapping } from "@/lib/types";
import { randomUUID } from "crypto";

/** snake_case DB 행을 camelCase CustomerMapping으로 변환 */
function toModel(row: Record<string, unknown>): CustomerMapping {
  return {
    id: row.id as string,
    omsName: row.oms_name as string,
    ecountCode: row.ecount_code as string,
    ecountName: row.ecount_name as string,
    chain: row.chain as "davichi" | "manager",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** 거래처 목록 조회 (검색, 페이지네이션) */
export function findAll(options?: {
  search?: string;
  page?: number;
  size?: number;
}): { data: CustomerMapping[]; total: number } {
  const db = getDb();
  const { search, page = 1, size = 20 } = options ?? {};
  const offset = (page - 1) * size;

  let where = "";
  const params: unknown[] = [];

  if (search) {
    where =
      "WHERE oms_name LIKE ? OR ecount_code LIKE ? OR ecount_name LIKE ?";
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  const total = db
    .prepare(`SELECT COUNT(*) as cnt FROM customers ${where}`)
    .get(...params) as { cnt: number };

  const rows = db
    .prepare(
      `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, size, offset) as Record<string, unknown>[];

  return { data: rows.map(toModel), total: total.cnt };
}

/** OMS 거래처명으로 매핑 검색 (정확 매칭 우선, 부분 매칭 fallback) */
export function findByOmsName(name: string): CustomerMapping | undefined {
  const db = getDb();
  const exact = db
    .prepare("SELECT * FROM customers WHERE oms_name = ?")
    .get(name) as Record<string, unknown> | undefined;
  if (exact) return toModel(exact);

  const partial = db
    .prepare("SELECT * FROM customers WHERE oms_name LIKE ? LIMIT 1")
    .get(`%${name}%`) as Record<string, unknown> | undefined;
  return partial ? toModel(partial) : undefined;
}

/** ID로 거래처 조회 */
export function findById(id: string): CustomerMapping | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? toModel(row) : undefined;
}

/** 거래처 추가 */
export function create(data: {
  omsName: string;
  ecountCode: string;
  ecountName: string;
  chain: "davichi" | "manager";
}): CustomerMapping {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO customers (id, oms_name, ecount_code, ecount_name, chain, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.omsName, data.ecountCode, data.ecountName, data.chain, now, now);
  return findById(id)!;
}

/** 거래처 수정 */
export function update(
  id: string,
  data: Partial<{
    omsName: string;
    ecountCode: string;
    ecountName: string;
    chain: "davichi" | "manager";
  }>
): CustomerMapping | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.omsName !== undefined) {
    fields.push("oms_name = ?");
    values.push(data.omsName);
  }
  if (data.ecountCode !== undefined) {
    fields.push("ecount_code = ?");
    values.push(data.ecountCode);
  }
  if (data.ecountName !== undefined) {
    fields.push("ecount_name = ?");
    values.push(data.ecountName);
  }
  if (data.chain !== undefined) {
    fields.push("chain = ?");
    values.push(data.chain);
  }

  if (fields.length === 0) return findById(id);

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
  return findById(id);
}

/** 거래처 삭제 */
export function remove(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  return result.changes > 0;
}

/** 미매핑 거래처 목록 */
export function getUnmapped(): CustomerMapping[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM customers WHERE ecount_code = '' ORDER BY oms_name")
    .all() as Record<string, unknown>[];
  return rows.map(toModel);
}

/** 일괄 매핑 수정 */
export function bulkUpdate(
  updates: { id: string; ecountCode: string }[]
): number {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    "UPDATE customers SET ecount_code = ?, updated_at = ? WHERE id = ?"
  );
  const run = db.transaction(() => {
    let count = 0;
    for (const { id, ecountCode } of updates) {
      const result = stmt.run(ecountCode, now, id);
      count += result.changes;
    }
    return count;
  });
  return run();
}

/** 전체 거래처 수 */
export function count(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as cnt FROM customers").get() as {
    cnt: number;
  };
  return row.cnt;
}

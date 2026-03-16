import { getDb } from "../connection";
import type { EcountOutputRow } from "@/lib/types";
import { randomUUID } from "crypto";

export interface ConversionLog {
  id: string;
  fileName: string;
  chain: string;
  totalRows: number;
  unmappedCount: number;
  convertedAt: string;
}

export interface ConversionLogWithRows extends ConversionLog {
  rows: EcountOutputRow[];
}

/** DB 행을 ConversionLog로 변환 */
function toModel(row: Record<string, unknown>): ConversionLog {
  return {
    id: row.id as string,
    fileName: row.file_name as string,
    chain: row.chain as string,
    totalRows: row.total_rows as number,
    unmappedCount: row.unmapped_count as number,
    convertedAt: row.converted_at as string,
  };
}

/** 변환 이력 생성 (트랜잭션) */
export function create(
  data: {
    fileName: string;
    chain: string;
    totalRows: number;
    unmappedCount: number;
  },
  rows: EcountOutputRow[]
): ConversionLog {
  const db = getDb();
  const id = randomUUID();

  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO conversion_logs (id, file_name, chain, total_rows, unmapped_count)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, data.fileName, data.chain, data.totalRows, data.unmappedCount);

    const stmt = db.prepare(
      `INSERT INTO conversion_rows
       (log_id, customer_code, customer_name, item_code, item_name, spec, quantity, unit_price, supply_amount, remark, is_unmapped, unmapped_field)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of rows) {
      stmt.run(
        id,
        row.customerCode,
        row.customerName,
        row.itemCode,
        row.itemName,
        row.spec,
        row.quantity,
        row.unitPrice,
        row.supplyAmount,
        row.remark,
        row._unmapped ? 1 : 0,
        row._unmappedField ?? null
      );
    }
  });

  run();

  const log = db
    .prepare("SELECT * FROM conversion_logs WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return toModel(log);
}

/** 변환 이력 목록 */
export function findAll(options?: {
  page?: number;
  size?: number;
}): { data: ConversionLog[]; total: number } {
  const db = getDb();
  const { page = 1, size = 20 } = options ?? {};
  const offset = (page - 1) * size;

  const total = db
    .prepare("SELECT COUNT(*) as cnt FROM conversion_logs")
    .get() as { cnt: number };

  const rows = db
    .prepare(
      "SELECT * FROM conversion_logs ORDER BY converted_at DESC LIMIT ? OFFSET ?"
    )
    .all(size, offset) as Record<string, unknown>[];

  return { data: rows.map(toModel), total: total.cnt };
}

/** ID로 변환 이력 조회 */
export function findById(id: string): ConversionLog | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM conversion_logs WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? toModel(row) : undefined;
}

/** 대시보드 통계: 특정 날짜의 변환 성공 수 */
export function countByDate(date: string): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM conversion_logs WHERE date(converted_at) = ?"
    )
    .get(date) as { cnt: number };
  return row.cnt;
}

/** 대시보드 통계: 특정 날짜의 미매핑 총 수 */
export function unmappedCountByDate(date: string): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(unmapped_count), 0) as cnt FROM conversion_logs WHERE date(converted_at) = ?"
    )
    .get(date) as { cnt: number };
  return row.cnt;
}

/** 대시보드 통계: 일별 처리량 (최근 N일) */
export function dailyStats(
  days: number = 7
): { date: string; converted: number; unmapped: number }[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT date(converted_at) as date,
              COUNT(*) as converted,
              COALESCE(SUM(unmapped_count), 0) as unmapped
       FROM conversion_logs
       WHERE converted_at >= datetime('now', ? || ' days')
       GROUP BY date(converted_at)
       ORDER BY date`
    )
    .all(`-${days}`) as { date: string; converted: number; unmapped: number }[];
  return rows;
}

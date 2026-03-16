import { getDb } from "../connection";
import type { BoxStandard } from "@/lib/types";

/** DB 행을 BoxStandard로 변환 */
function toBoxStandard(row: Record<string, unknown>): BoxStandard {
  return {
    id: row.id as string,
    category: row.category as string,
    itemCode: row.item_code as string,
    itemName: row.item_name as string,
    maxPerBox: row.max_per_box as number,
  };
}

/** 모든 박스 포장 기준 조회 */
export function getBoxStandards(): BoxStandard[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM box_standards ORDER BY category")
    .all() as Record<string, unknown>[];
  return rows.map(toBoxStandard);
}

/** 박스 포장 기준 수정 */
export function updateBoxStandard(id: string, maxPerBox: number): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE box_standards SET max_per_box = ? WHERE id = ?")
    .run(maxPerBox, id);
  return result.changes > 0;
}

/** 카테고리별 박스 기준 조회 */
export function getStandardByCategory(
  category: string
): BoxStandard | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM box_standards WHERE category = ?")
    .get(category) as Record<string, unknown> | undefined;
  return row ? toBoxStandard(row) : undefined;
}

/** 시스템 설정 조회 */
export function getSetting(key: string): string | undefined {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

/** 시스템 설정 저장 */
export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
  ).run(key, value, value);
}

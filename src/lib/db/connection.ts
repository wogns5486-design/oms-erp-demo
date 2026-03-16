import Database from "better-sqlite3";
import path from "path";
import { runMigrations } from "./migrate";

let db: Database.Database | null = null;

/** SQLite DB 싱글톤 연결. 앱 시작 시 자동 마이그레이션 실행 */
export function getDb(): Database.Database {
  if (db) return db;

  const dbPath =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "oms-erp.db");

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  runMigrations(db);

  return db;
}

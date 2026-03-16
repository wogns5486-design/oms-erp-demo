import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { runMigrations } from "./migrate";

let db: Database.Database | null = null;

/** 시드 데이터 삽입 (DB가 비어있을 때 자동 실행) */
function seedIfEmpty(database: Database.Database): void {
  const row = database
    .prepare("SELECT COUNT(*) as cnt FROM customers")
    .get() as { cnt: number } | undefined;

  if (row && row.cnt > 0) return;

  const dataDir = path.join(process.cwd(), "public", "data");
  if (!fs.existsSync(path.join(dataDir, "customers.json"))) return;

  const customers = JSON.parse(
    fs.readFileSync(path.join(dataDir, "customers.json"), "utf-8")
  );
  const products = JSON.parse(
    fs.readFileSync(path.join(dataDir, "products.json"), "utf-8")
  );
  const boxStandards = JSON.parse(
    fs.readFileSync(path.join(dataDir, "box-standards.json"), "utf-8")
  );
  const shipments = JSON.parse(
    fs.readFileSync(path.join(dataDir, "shipments.json"), "utf-8")
  );

  const run = database.transaction(() => {
    const insertC = database.prepare(
      "INSERT OR IGNORE INTO customers (id, oms_name, ecount_code, ecount_name, chain, created_at, updated_at) VALUES (?,?,?,?,?,?,?)"
    );
    for (const c of customers) {
      insertC.run(c.id, c.omsName, c.ecountCode, c.ecountName, c.chain, c.createdAt, c.updatedAt);
    }

    const insertP = database.prepare(
      "INSERT OR IGNORE INTO products (id, oms_product_name, ecount_item_code, ecount_item_name, spec, unit_price, category, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)"
    );
    for (const p of products) {
      insertP.run(p.id, p.omsProductName, p.ecountItemCode, p.ecountItemName, p.spec, p.unitPrice, p.category, p.createdAt, p.updatedAt);
    }

    const insertBS = database.prepare(
      "INSERT OR IGNORE INTO box_standards (id, category, item_code, item_name, max_per_box) VALUES (?,?,?,?,?)"
    );
    for (const bs of boxStandards) {
      insertBS.run(bs.id, bs.category, bs.itemCode, bs.itemName, bs.maxPerBox);
    }

    const insertS = database.prepare(
      "INSERT OR IGNORE INTO shipments (id, date, customer_code, customer_name, recipient_name, recipient_phone, recipient_address, status) VALUES (?,?,?,?,?,?,?,?)"
    );
    const insertSI = database.prepare(
      "INSERT INTO shipment_items (shipment_id, item_code, item_name, quantity, spec, category) VALUES (?,?,?,?,?,?)"
    );
    for (const s of shipments) {
      insertS.run(s.id, s.date, s.customerCode, s.customerName, s.recipientName, s.recipientPhone, s.recipientAddress, s.status);
      for (const item of s.items) {
        insertSI.run(s.id, item.itemCode, item.itemName, item.quantity, item.spec, item.category);
      }
    }
  });

  run();
}

/** SQLite DB 싱글톤 연결. 자동 마이그레이션 + 시드 실행 */
export function getDb(): Database.Database {
  if (db) return db;

  // Vercel 서버리스: /tmp 사용, 로컬: data/ 디렉토리 사용
  const dbPath =
    process.env.DATABASE_PATH ||
    (process.env.VERCEL
      ? "/tmp/oms-erp.db"
      : path.join(process.cwd(), "data", "oms-erp.db"));

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  runMigrations(db);
  seedIfEmpty(db);

  return db;
}

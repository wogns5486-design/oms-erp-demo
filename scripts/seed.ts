/**
 * 시드 데이터 스크립트
 * public/data/*.json 파일을 SQLite DB에 초기 데이터로 삽입
 * 실행: npx tsx scripts/seed.ts
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "oms-erp.db");
const DATA_DIR = path.join(process.cwd(), "public", "data");

// DB 디렉토리 생성
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// 마이그레이션 실행
const migrationPath = path.join(
  process.cwd(),
  "src",
  "lib",
  "db",
  "migrations",
  "001_initial.sql"
);
const migrationSql = fs.readFileSync(migrationPath, "utf-8");
db.exec(migrationSql);
console.log("마이그레이션 완료");

// JSON 파일 로드
function loadJson<T>(fileName: string): T {
  const filePath = path.join(DATA_DIR, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const seed = db.transaction(() => {
  // 거래처 시드
  const customers = loadJson<
    {
      id: string;
      omsName: string;
      ecountCode: string;
      ecountName: string;
      chain: string;
      createdAt: string;
      updatedAt: string;
    }[]
  >("customers.json");

  const insertCustomer = db.prepare(
    `INSERT OR IGNORE INTO customers (id, oms_name, ecount_code, ecount_name, chain, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const c of customers) {
    insertCustomer.run(
      c.id,
      c.omsName,
      c.ecountCode,
      c.ecountName,
      c.chain,
      c.createdAt,
      c.updatedAt
    );
  }
  console.log(`거래처 ${customers.length}건 삽입`);

  // 품목 시드
  const products = loadJson<
    {
      id: string;
      omsProductName: string;
      ecountItemCode: string;
      ecountItemName: string;
      spec: string;
      unitPrice: number;
      category: string;
      createdAt: string;
      updatedAt: string;
    }[]
  >("products.json");

  const insertProduct = db.prepare(
    `INSERT OR IGNORE INTO products (id, oms_product_name, ecount_item_code, ecount_item_name, spec, unit_price, category, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of products) {
    insertProduct.run(
      p.id,
      p.omsProductName,
      p.ecountItemCode,
      p.ecountItemName,
      p.spec,
      p.unitPrice,
      p.category,
      p.createdAt,
      p.updatedAt
    );
  }
  console.log(`품목 ${products.length}건 삽입`);

  // 박스 포장 기준 시드
  const boxStandards = loadJson<
    {
      id: string;
      category: string;
      itemCode: string;
      itemName: string;
      maxPerBox: number;
    }[]
  >("box-standards.json");

  const insertBoxStandard = db.prepare(
    `INSERT OR IGNORE INTO box_standards (id, category, item_code, item_name, max_per_box)
     VALUES (?, ?, ?, ?, ?)`
  );
  for (const bs of boxStandards) {
    insertBoxStandard.run(
      bs.id,
      bs.category,
      bs.itemCode,
      bs.itemName,
      bs.maxPerBox
    );
  }
  console.log(`박스 기준 ${boxStandards.length}건 삽입`);

  // 출고 데이터 시드
  const shipments = loadJson<
    {
      id: string;
      date: string;
      customerCode: string;
      customerName: string;
      recipientName: string;
      recipientPhone: string;
      recipientAddress: string;
      items: {
        itemCode: string;
        itemName: string;
        quantity: number;
        spec: string;
        category: string;
      }[];
      status: string;
    }[]
  >("shipments.json");

  const insertShipment = db.prepare(
    `INSERT OR IGNORE INTO shipments (id, date, customer_code, customer_name, recipient_name, recipient_phone, recipient_address, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertShipmentItem = db.prepare(
    `INSERT INTO shipment_items (shipment_id, item_code, item_name, quantity, spec, category)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  // 기존 shipment_items 삭제 (중복 실행 방지)
  for (const s of shipments) {
    db.prepare("DELETE FROM shipment_items WHERE shipment_id = ?").run(s.id);
  }

  for (const s of shipments) {
    insertShipment.run(
      s.id,
      s.date,
      s.customerCode,
      s.customerName,
      s.recipientName,
      s.recipientPhone,
      s.recipientAddress,
      s.status
    );
    for (const item of s.items) {
      insertShipmentItem.run(
        s.id,
        item.itemCode,
        item.itemName,
        item.quantity,
        item.spec,
        item.category
      );
    }
  }
  console.log(`출고 ${shipments.length}건 삽입 (품목 포함)`);
});

seed();
db.close();
console.log("\n시드 데이터 삽입 완료!");
console.log(`DB 경로: ${DB_PATH}`);

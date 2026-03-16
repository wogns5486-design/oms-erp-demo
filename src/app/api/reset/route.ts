import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/connection";
import { ok, error } from "@/lib/api/response";
import fs from "fs";
import path from "path";

/** POST /api/reset - DB 초기화 (시드 데이터 재삽입) */
export async function POST(_request: NextRequest) {
  try {
    const db = getDb();
    const dataDir = path.join(process.cwd(), "public", "data");

    // 기존 데이터 삭제 (순서 중요: FK 의존성)
    db.exec("DELETE FROM invoice_items");
    db.exec("DELETE FROM invoices");
    db.exec("DELETE FROM shipment_items");
    db.exec("DELETE FROM shipments");
    db.exec("DELETE FROM conversion_rows");
    db.exec("DELETE FROM conversion_logs");
    db.exec("DELETE FROM customers");
    db.exec("DELETE FROM products");
    db.exec("DELETE FROM box_standards");
    db.exec("DELETE FROM invoice_sequence");

    // JSON 시드 데이터 재삽입
    const customers = JSON.parse(fs.readFileSync(path.join(dataDir, "customers.json"), "utf-8"));
    const insertC = db.prepare(
      "INSERT INTO customers (id, oms_name, ecount_code, ecount_name, chain, created_at, updated_at) VALUES (?,?,?,?,?,?,?)"
    );
    for (const c of customers) {
      insertC.run(c.id, c.omsName, c.ecountCode, c.ecountName, c.chain, c.createdAt, c.updatedAt);
    }

    const products = JSON.parse(fs.readFileSync(path.join(dataDir, "products.json"), "utf-8"));
    const insertP = db.prepare(
      "INSERT INTO products (id, oms_product_name, ecount_item_code, ecount_item_name, spec, unit_price, category, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)"
    );
    for (const p of products) {
      insertP.run(p.id, p.omsProductName, p.ecountItemCode, p.ecountItemName, p.spec, p.unitPrice, p.category, p.createdAt, p.updatedAt);
    }

    const boxStandards = JSON.parse(fs.readFileSync(path.join(dataDir, "box-standards.json"), "utf-8"));
    const insertBS = db.prepare(
      "INSERT INTO box_standards (id, category, item_code, item_name, max_per_box) VALUES (?,?,?,?,?)"
    );
    for (const bs of boxStandards) {
      insertBS.run(bs.id, bs.category, bs.itemCode, bs.itemName, bs.maxPerBox);
    }

    const shipments = JSON.parse(fs.readFileSync(path.join(dataDir, "shipments.json"), "utf-8"));
    const insertS = db.prepare(
      "INSERT INTO shipments (id, date, customer_code, customer_name, recipient_name, recipient_phone, recipient_address, status) VALUES (?,?,?,?,?,?,?,?)"
    );
    const insertSI = db.prepare(
      "INSERT INTO shipment_items (shipment_id, item_code, item_name, quantity, spec, category) VALUES (?,?,?,?,?,?)"
    );
    for (const s of shipments) {
      insertS.run(s.id, s.date, s.customerCode, s.customerName, s.recipientName, s.recipientPhone, s.recipientAddress, s.status);
      for (const item of s.items) {
        insertSI.run(s.id, item.itemCode, item.itemName, item.quantity, item.spec, item.category);
      }
    }

    return ok({ message: "초기화 완료" });
  } catch (err) {
    console.error("[POST /api/reset]", err);
    return error("초기화 실패", 500);
  }
}

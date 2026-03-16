-- 거래처 매핑
CREATE TABLE IF NOT EXISTS customers (
  id          TEXT PRIMARY KEY,
  oms_name    TEXT NOT NULL,
  ecount_code TEXT NOT NULL DEFAULT '',
  ecount_name TEXT NOT NULL DEFAULT '',
  chain       TEXT NOT NULL CHECK(chain IN ('davichi', 'manager')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customers_oms_name ON customers(oms_name);
CREATE INDEX IF NOT EXISTS idx_customers_ecount_code ON customers(ecount_code);

-- 품목 매핑
CREATE TABLE IF NOT EXISTS products (
  id               TEXT PRIMARY KEY,
  oms_product_name TEXT NOT NULL,
  ecount_item_code TEXT NOT NULL DEFAULT '',
  ecount_item_name TEXT NOT NULL DEFAULT '',
  spec             TEXT NOT NULL DEFAULT '',
  unit_price       INTEGER NOT NULL DEFAULT 0,
  category         TEXT NOT NULL CHECK(category IN ('frame','lens','case','accessory','etc')),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_oms_name ON products(oms_product_name);
CREATE INDEX IF NOT EXISTS idx_products_ecount_code ON products(ecount_item_code);

-- 출고
CREATE TABLE IF NOT EXISTS shipments (
  id                TEXT PRIMARY KEY,
  date              TEXT NOT NULL,
  customer_code     TEXT NOT NULL,
  customer_name     TEXT NOT NULL,
  recipient_name    TEXT NOT NULL,
  recipient_phone   TEXT NOT NULL DEFAULT '',
  recipient_address TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','invoiced','shipped','cancelled')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(date);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- 출고 품목
CREATE TABLE IF NOT EXISTS shipment_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  item_code   TEXT NOT NULL,
  item_name   TEXT NOT NULL,
  quantity    INTEGER NOT NULL,
  spec        TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'etc'
);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON shipment_items(shipment_id);

-- 송장
CREATE TABLE IF NOT EXISTS invoices (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id    TEXT NOT NULL REFERENCES shipments(id),
  invoice_number TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'active'
                 CHECK(status IN ('active','cancelled','reissued')),
  box_number     INTEGER NOT NULL,
  issued_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_invoices_shipment ON invoices(shipment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- 송장 품목
CREATE TABLE IF NOT EXISTS invoice_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_name  TEXT NOT NULL,
  quantity   INTEGER NOT NULL
);

-- 박스 포장 기준
CREATE TABLE IF NOT EXISTS box_standards (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL UNIQUE,
  item_code   TEXT NOT NULL DEFAULT '',
  item_name   TEXT NOT NULL,
  max_per_box INTEGER NOT NULL DEFAULT 20
);

-- 변환 이력
CREATE TABLE IF NOT EXISTS conversion_logs (
  id             TEXT PRIMARY KEY,
  file_name      TEXT NOT NULL,
  chain          TEXT NOT NULL,
  total_rows     INTEGER NOT NULL,
  unmapped_count INTEGER NOT NULL,
  converted_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 변환 이력 행
CREATE TABLE IF NOT EXISTS conversion_rows (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id         TEXT NOT NULL REFERENCES conversion_logs(id) ON DELETE CASCADE,
  customer_code  TEXT NOT NULL DEFAULT '',
  customer_name  TEXT NOT NULL DEFAULT '',
  item_code      TEXT NOT NULL DEFAULT '',
  item_name      TEXT NOT NULL DEFAULT '',
  spec           TEXT NOT NULL DEFAULT '',
  quantity       INTEGER NOT NULL DEFAULT 0,
  unit_price     INTEGER NOT NULL DEFAULT 0,
  supply_amount  INTEGER NOT NULL DEFAULT 0,
  remark         TEXT NOT NULL DEFAULT '',
  is_unmapped    INTEGER NOT NULL DEFAULT 0,
  unmapped_field TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversion_rows_log ON conversion_rows(log_id);

-- 송장 시퀀스 (일별)
CREATE TABLE IF NOT EXISTS invoice_sequence (
  date TEXT PRIMARY KEY,
  seq  INTEGER NOT NULL DEFAULT 0
);

-- 시스템 설정
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

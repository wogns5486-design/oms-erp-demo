// 거래처 매핑
export interface CustomerMapping {
  id: string;
  omsName: string;
  ecountCode: string;
  ecountName: string;
  chain: "davichi" | "manager";
  createdAt: string;
  updatedAt: string;
}

// 품목 매핑
export interface ProductMapping {
  id: string;
  omsProductName: string;
  ecountItemCode: string;
  ecountItemName: string;
  spec: string;
  unitPrice: number;
  category: "frame" | "lens" | "case" | "accessory" | "etc";
  createdAt: string;
  updatedAt: string;
}

// 출고 데이터
export interface Shipment {
  id: string;
  date: string;
  customerCode: string;
  customerName: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  items: ShipmentItem[];
  status: "pending" | "invoiced" | "shipped" | "cancelled";
  invoices: InvoiceRecord[];
}

export interface ShipmentItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  spec: string;
  category: string;
}

export interface InvoiceRecord {
  invoiceNumber: string;
  status: "active" | "cancelled" | "reissued";
  issuedAt: string;
  boxNumber: number;
  items: { itemName: string; quantity: number }[];
}

// 박스 기준값
export interface BoxStandard {
  id: string;
  category: string;
  itemCode: string;
  itemName: string;
  maxPerBox: number;
}

// 박스 분할 결과
export interface BoxSplitResult {
  recipientName: string;
  totalBoxes: number;
  boxes: {
    boxNumber: number;
    items: { itemName: string; quantity: number; category: string }[];
    invoiceNumber?: string;
  }[];
}

// 대시보드 통계
export interface DashboardStats {
  todayOrders: number;
  todayConverted: number;
  todayFailed: number;
  todayInvoices: number;
  dailyStats: {
    date: string;
    orders: number;
    converted: number;
    invoices: number;
  }[];
  recentActivity: {
    time: string;
    action: string;
    detail: string;
    status: "success" | "error" | "info";
  }[];
}

// OMS 엑셀 행 (다비치)
export interface DavichiOmsRow {
  orderDate: string;
  storeName: string;
  customerName: string;
  productCode: string;
  productName: string;
  quantity: number;
  address: string;
}

// OMS 엑셀 행 (안경매니저)
export interface ManagerOmsRow {
  date: string;
  branch: string;
  recipientName: string;
  itemNumber: string;
  itemName: string;
  orderQuantity: number;
  address: string;
  phone: string;
}

// 이카운트 ERP 출력 행
export interface EcountOutputRow {
  customerCode: string;
  customerName: string;
  itemCode: string;
  itemName: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  remark: string;
  _unmapped?: boolean;
  _unmappedField?: "customer" | "product" | "both";
}

// 변환 결과
export interface ConversionResult {
  id: string;
  fileName: string;
  chain: "davichi" | "manager" | "unknown";
  originalRows: Record<string, unknown>[];
  convertedRows: EcountOutputRow[];
  unmappedCount: number;
  totalRows: number;
  convertedAt: string;
}

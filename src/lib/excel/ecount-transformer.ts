import type { EcountOutputRow, CustomerMapping, ProductMapping } from "@/lib/types";
import type { ParsedSheet } from "./parser";
import type { ChainType } from "./chain-identifier";

/** 매핑 조회 함수 인터페이스 (의존성 주입) */
export interface MappingLookup {
  findCustomer: (omsName: string) => CustomerMapping | undefined;
  findProduct: (omsName: string) => ProductMapping | undefined;
}

/**
 * OMS 엑셀 데이터를 이카운트 ERP 형식으로 변환
 * @param sheet - 파싱된 엑셀 시트
 * @param chain - 프랜차이즈 유형 (davichi, manager, unknown)
 * @param lookup - 거래처/품목 매핑 조회 함수
 */
export function transformToEcount(
  sheet: ParsedSheet,
  chain: ChainType,
  lookup: MappingLookup
): EcountOutputRow[] {
  const { findCustomer, findProduct } = lookup;

  return sheet.rows.map((row) => {
    let omsCustomerName = "";
    let omsProductName = "";
    let quantity = 0;

    if (chain === "davichi") {
      omsCustomerName = String(row["매장명"] ?? row["거래처명"] ?? "");
      omsProductName = String(row["품명"] ?? row["상품명"] ?? "");
      quantity = Number(row["수량"] ?? row["주문수량"] ?? 0);
    } else if (chain === "manager") {
      omsCustomerName = String(row["지점"] ?? "");
      omsProductName = String(row["품명"] ?? row["상품명"] ?? "");
      quantity = Number(row["수량"] ?? row["주문수량"] ?? 0);
    } else {
      omsCustomerName = String(
        row["거래처"] ?? row["매장명"] ?? row["지점"] ?? ""
      );
      omsProductName = String(row["품명"] ?? row["상품명"] ?? "");
      quantity = Number(row["수량"] ?? 0);
    }

    const customer = findCustomer(omsCustomerName);
    const product = findProduct(omsProductName);

    const customerMapped = !!(customer && customer.ecountCode);
    const productMapped = !!(product && product.ecountItemCode);

    let unmappedField: "customer" | "product" | "both" | undefined;
    if (!customerMapped && !productMapped) unmappedField = "both";
    else if (!customerMapped) unmappedField = "customer";
    else if (!productMapped) unmappedField = "product";

    const unitPrice = product?.unitPrice ?? 0;
    const supplyAmount = unitPrice * quantity;

    return {
      customerCode: customer?.ecountCode ?? "",
      customerName: customer?.ecountName ?? omsCustomerName,
      itemCode: product?.ecountItemCode ?? "",
      itemName: product?.ecountItemName ?? omsProductName,
      spec: product?.spec ?? "",
      quantity,
      unitPrice,
      supplyAmount,
      remark: chain === "davichi" ? "다비치" : chain === "manager" ? "안경매니저" : "",
      _unmapped: !!unmappedField,
      _unmappedField: unmappedField,
    };
  });
}

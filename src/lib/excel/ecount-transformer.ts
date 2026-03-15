import type { EcountOutputRow } from "@/lib/types";
import type { ParsedSheet } from "./parser";
import type { ChainType } from "./chain-identifier";
import { useMappingStore } from "@/stores/mapping-store";

export function transformToEcount(
  sheet: ParsedSheet,
  chain: ChainType
): EcountOutputRow[] {
  const { findCustomerByOmsName, findProductByOmsName } =
    useMappingStore.getState();

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

    const customer = findCustomerByOmsName(omsCustomerName);
    const product = findProductByOmsName(omsProductName);

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

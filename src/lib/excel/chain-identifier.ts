import type { ParsedSheet } from "./parser";

export type ChainType = "davichi" | "manager" | "unknown";

export function identifyChain(sheet: ParsedSheet): ChainType {
  const headers = sheet.headers.map((h) => String(h).trim());

  // 다비치: "매장명" 컬럼 포함
  if (headers.some((h) => h.includes("매장명"))) {
    return "davichi";
  }

  // 안경매니저: "지점" + "수령인" 컬럼 포함
  const hasBranch = headers.some((h) => h.includes("지점"));
  const hasRecipient = headers.some((h) => h.includes("수령인"));
  if (hasBranch && hasRecipient) {
    return "manager";
  }

  return "unknown";
}

export function getChainLabel(chain: ChainType): string {
  switch (chain) {
    case "davichi":
      return "다비치안경";
    case "manager":
      return "안경매니저";
    default:
      return "알 수 없음";
  }
}

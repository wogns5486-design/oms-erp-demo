import { NextRequest } from "next/server";
import * as productRepo from "@/lib/db/repositories/product-repo";
import { ok, paginated, error } from "@/lib/api/response";

/**
 * GET /api/products
 * 품목 목록 조회. query params: search, page(기본1), size(기본20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const size = Number(searchParams.get("size") ?? "20");

    const { data, total } = productRepo.findAll({ search, page, size });
    return paginated(data, total, page, size);
  } catch (e) {
    console.error("[GET /api/products]", e);
    return error("품목 목록 조회 중 오류가 발생했습니다.", 500);
  }
}

/**
 * POST /api/products
 * 품목 추가. body: { omsProductName, ecountItemCode, ecountItemName, spec, unitPrice, category }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { omsProductName, ecountItemCode, ecountItemName, spec, unitPrice, category } = body;

    if (!omsProductName || !ecountItemCode || !ecountItemName || !category) {
      return error("omsProductName, ecountItemCode, ecountItemName, category 는 필수 항목입니다.");
    }

    const validCategories = ["frame", "lens", "case", "accessory", "etc"];
    if (!validCategories.includes(category)) {
      return error(`category 는 ${validCategories.join(", ")} 중 하나이어야 합니다.`);
    }

    const product = productRepo.create({
      omsProductName,
      ecountItemCode,
      ecountItemName,
      spec: spec ?? "",
      unitPrice: unitPrice ?? 0,
      category,
    });
    return ok(product);
  } catch (e) {
    console.error("[POST /api/products]", e);
    return error("품목 추가 중 오류가 발생했습니다.", 500);
  }
}

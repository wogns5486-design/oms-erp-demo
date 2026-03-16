import { NextRequest } from "next/server";
import * as customerRepo from "@/lib/db/repositories/customer-repo";
import { ok, paginated, error } from "@/lib/api/response";

/**
 * GET /api/customers
 * 거래처 목록 조회. query params: search, page(기본1), size(기본20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const size = Number(searchParams.get("size") ?? "20");

    const { data, total } = customerRepo.findAll({ search, page, size });
    return paginated(data, total, page, size);
  } catch (e) {
    console.error("[GET /api/customers]", e);
    return error("거래처 목록 조회 중 오류가 발생했습니다.", 500);
  }
}

/**
 * POST /api/customers
 * 거래처 추가. body: { omsName, ecountCode, ecountName, chain }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { omsName, ecountCode, ecountName, chain } = body;

    if (!omsName || !ecountCode || !ecountName || !chain) {
      return error("omsName, ecountCode, ecountName, chain 은 필수 항목입니다.");
    }
    if (chain !== "davichi" && chain !== "manager") {
      return error("chain 은 'davichi' 또는 'manager' 이어야 합니다.");
    }

    const customer = customerRepo.create({ omsName, ecountCode, ecountName, chain });
    return ok(customer);
  } catch (e) {
    console.error("[POST /api/customers]", e);
    return error("거래처 추가 중 오류가 발생했습니다.", 500);
  }
}

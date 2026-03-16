import { NextRequest } from "next/server";
import * as conversionLogRepo from "@/lib/db/repositories/conversion-log-repo";
import { paginated, error } from "@/lib/api/response";

/**
 * GET /api/convert/history
 * 변환 이력 목록 조회
 * query params: page(기본1), size(기본20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page") ?? "1");
    const size = Number(searchParams.get("size") ?? "20");

    const { data, total } = conversionLogRepo.findAll({ page, size });
    return paginated(data, total, page, size);
  } catch (e) {
    console.error("[GET /api/convert/history]", e);
    return error("변환 이력 조회 중 오류가 발생했습니다.", 500);
  }
}

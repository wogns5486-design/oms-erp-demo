import { NextResponse } from "next/server";

/** 성공 응답 */
export function ok<T>(data: T) {
  return NextResponse.json(data);
}

/** 페이지네이션 응답 */
export function paginated<T>(data: T[], total: number, page: number, size: number) {
  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    },
  });
}

/** 에러 응답 */
export function error(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

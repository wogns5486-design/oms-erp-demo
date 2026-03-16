/**
 * 이카운트 ERP API 팩토리
 * 환경에 따라 적절한 API 구현체를 생성합니다.
 */

import type { IEcountApi } from "./interface";
import { MockEcountApi } from "./mock";

export type { IEcountApi } from "./interface";
export type {
  EcountSession,
  EcountSalesRow,
  EcountResponse,
  EcountCustomer,
  EcountItem,
} from "./types";

/**
 * 이카운트 ERP API 구현 모드
 * - mock: 테스트/개발용 가짜 구현체 사용
 * - real: 실제 이카운트 ERP API 연결 (향후 구현 예정)
 */
export type EcountApiMode = "mock" | "real";

/**
 * 이카운트 ERP API 인스턴스를 생성합니다.
 *
 * 모드 결정 우선순위:
 * 1. `mode` 파라미터로 직접 지정
 * 2. 환경변수 `ECOUNT_API_MODE` 값 사용
 * 3. 기본값: `mock`
 *
 * @param mode - API 구현 모드 ('mock' | 'real'). 생략 시 환경변수 또는 기본값 사용.
 * @returns IEcountApi 구현체
 * @throws Error - real 모드 요청 시 미구현 오류 발생
 *
 * @example
 * // mock 모드로 생성 (기본값)
 * const api = createEcountApi();
 *
 * @example
 * // 명시적으로 mock 모드 지정
 * const api = createEcountApi('mock');
 *
 * @example
 * // 환경변수로 모드 지정: ECOUNT_API_MODE=mock
 * const api = createEcountApi();
 */
export function createEcountApi(mode?: EcountApiMode): IEcountApi {
  const resolvedMode: EcountApiMode =
    mode ??
    (process.env.ECOUNT_API_MODE as EcountApiMode | undefined) ??
    "mock";

  if (resolvedMode === "real") {
    throw new Error(
      "이카운트 ERP 실제 API 연결은 향후 구현 예정입니다. 현재는 mock 모드를 사용해 주세요."
    );
  }

  return new MockEcountApi();
}

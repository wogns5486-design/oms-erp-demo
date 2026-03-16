import type { ILogenApi } from './interface';
import { MockLogenApi } from './mock';

/**
 * 로젠택배 API 인스턴스를 생성합니다.
 *
 * mode를 지정하지 않으면 환경변수 LOGEN_API_MODE 값을 사용하며,
 * 환경변수도 없으면 'mock' 모드로 동작합니다.
 *
 * @param mode 'mock' | 'real' - 동작 모드
 * @returns ILogenApi 구현체
 * @throws real 모드 요청 시 미구현 오류
 *
 * @example
 * // mock 모드 (기본)
 * const api = createLogenApi();
 *
 * @example
 * // 명시적 모드 지정
 * const api = createLogenApi('mock');
 */
export function createLogenApi(mode?: 'mock' | 'real'): ILogenApi {
  const resolvedMode = mode ?? (process.env.LOGEN_API_MODE as 'mock' | 'real' | undefined) ?? 'mock';

  if (resolvedMode === 'real') {
    throw new Error(
      '[LogenApi] real 모드는 향후 구현 예정입니다. 현재는 mock 모드만 지원합니다.'
    );
  }

  return new MockLogenApi();
}

export type { ILogenApi } from './interface';
export type {
  LogenInvoiceRequest,
  LogenInvoiceResponse,
  LogenBulkResponse,
  LogenTrackingResult,
  LogenCancelResponse,
} from './types';

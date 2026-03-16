/**
 * 이카운트 ERP API Mock 구현
 * 실제 API 연결 없이 테스트 및 개발 환경에서 사용하는 가짜 구현체입니다.
 */

import type { IEcountApi } from "./interface";
import type {
  EcountSession,
  EcountSalesRow,
  EcountResponse,
  EcountCustomer,
  EcountItem,
} from "./types";

/**
 * 이카운트 ERP API Mock 클래스
 * 실제 API를 호출하지 않고 지정된 동작을 시뮬레이션합니다.
 */
export class MockEcountApi implements IEcountApi {
  /**
   * 이카운트 ERP 로그인을 시뮬레이션합니다.
   * 항상 성공하며, 가짜 세션 ID를 반환합니다.
   * @param companyCode - 회사 코드
   * @param userId - 사용자 ID (mock에서는 무시됨)
   * @param password - 비밀번호 (mock에서는 무시됨)
   * @returns 가짜 세션 정보
   */
  async login(
    companyCode: string,
    userId: string,
    password: string
  ): Promise<EcountSession> {
    void userId;
    void password;
    return {
      sessionId: `mock-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      companyCode,
    };
  }

  /**
   * 수주 데이터 업로드를 시뮬레이션합니다.
   * 500ms 딜레이 후 90% 확률로 성공, 10% 확률로 실패를 반환합니다.
   * @param session - 로그인 세션 정보 (mock에서는 유효성 검사 없이 사용)
   * @param rows - 업로드할 수주 행 목록
   * @returns 성공 또는 실패 응답
   */
  async uploadSalesOrder(
    session: EcountSession,
    rows: EcountSalesRow[]
  ): Promise<EcountResponse> {
    void session;

    // 500ms 딜레이 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 10% 확률로 실패 시뮬레이션
    if (Math.random() < 0.1) {
      return {
        success: false,
        message: "[Mock] 수주 업로드 실패: 서버 오류가 발생했습니다.",
      };
    }

    return {
      success: true,
      message: `[Mock] 수주 업로드 성공: ${rows.length}건이 처리되었습니다.`,
      data: { processedCount: rows.length },
    };
  }

  /**
   * 거래처 목록 조회를 시뮬레이션합니다.
   * 항상 빈 배열을 반환합니다.
   * @param session - 로그인 세션 정보 (mock에서는 무시됨)
   * @param query - 검색어 (mock에서는 무시됨)
   * @returns 빈 거래처 목록
   */
  async getCustomers(
    session: EcountSession,
    query?: string
  ): Promise<EcountCustomer[]> {
    void session;
    void query;
    return [];
  }

  /**
   * 품목 목록 조회를 시뮬레이션합니다.
   * 항상 빈 배열을 반환합니다.
   * @param session - 로그인 세션 정보 (mock에서는 무시됨)
   * @param query - 검색어 (mock에서는 무시됨)
   * @returns 빈 품목 목록
   */
  async getItems(
    session: EcountSession,
    query?: string
  ): Promise<EcountItem[]> {
    void session;
    void query;
    return [];
  }
}

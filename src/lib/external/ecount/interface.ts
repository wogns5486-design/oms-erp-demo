/**
 * 이카운트 ERP API 인터페이스 정의
 * 실제 구현과 mock 구현이 모두 이 인터페이스를 따릅니다.
 */

import type {
  EcountSession,
  EcountSalesRow,
  EcountResponse,
  EcountCustomer,
  EcountItem,
} from "./types";

/**
 * 이카운트 ERP API 인터페이스
 * 로그인, 수주 업로드, 거래처/품목 조회 기능을 정의합니다.
 */
export interface IEcountApi {
  /**
   * 이카운트 ERP에 로그인합니다.
   * @param companyCode - 회사 코드
   * @param userId - 사용자 ID
   * @param password - 비밀번호
   * @returns 로그인 세션 정보
   */
  login(
    companyCode: string,
    userId: string,
    password: string
  ): Promise<EcountSession>;

  /**
   * 수주 데이터를 이카운트 ERP에 업로드합니다.
   * @param session - 로그인 세션 정보
   * @param rows - 업로드할 수주 행 목록
   * @returns API 응답 (성공/실패 여부 및 메시지)
   */
  uploadSalesOrder(
    session: EcountSession,
    rows: EcountSalesRow[]
  ): Promise<EcountResponse>;

  /**
   * 거래처 목록을 조회합니다.
   * @param session - 로그인 세션 정보
   * @param query - 검색어 (선택적)
   * @returns 거래처 목록
   */
  getCustomers(
    session: EcountSession,
    query?: string
  ): Promise<EcountCustomer[]>;

  /**
   * 품목 목록을 조회합니다.
   * @param session - 로그인 세션 정보
   * @param query - 검색어 (선택적)
   * @returns 품목 목록
   */
  getItems(session: EcountSession, query?: string): Promise<EcountItem[]>;
}

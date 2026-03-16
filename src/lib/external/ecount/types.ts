/**
 * 이카운트 ERP API 타입 정의
 * 실제 API 연동에 사용되는 요청/응답 타입을 정의합니다.
 */

/**
 * 이카운트 로그인 세션 정보
 * 로그인 성공 후 반환되는 세션 데이터입니다.
 */
export interface EcountSession {
  /** 세션 ID (API 호출 시 인증에 사용) */
  sessionId: string;
  /** 회사 코드 */
  companyCode: string;
}

/**
 * 이카운트 ERP 수주 데이터 행
 * 수주 업로드 시 전송하는 단일 행 데이터입니다.
 */
export interface EcountSalesRow {
  /** 거래처 코드 */
  customerCode: string;
  /** 거래처명 */
  customerName: string;
  /** 품목 코드 */
  itemCode: string;
  /** 품목명 */
  itemName: string;
  /** 규격 */
  spec: string;
  /** 수량 */
  quantity: number;
  /** 단가 */
  unitPrice: number;
  /** 공급가액 */
  supplyAmount: number;
  /** 비고 */
  remark: string;
}

/**
 * 이카운트 API 공통 응답 형식
 * 모든 API 호출의 결과를 나타냅니다.
 */
export interface EcountResponse {
  /** 요청 성공 여부 */
  success: boolean;
  /** 결과 메시지 */
  message: string;
  /** 응답 데이터 (선택적) */
  data?: unknown;
}

/**
 * 이카운트 거래처 정보
 */
export interface EcountCustomer {
  /** 거래처 코드 */
  code: string;
  /** 거래처명 */
  name: string;
}

/**
 * 이카운트 품목 정보
 */
export interface EcountItem {
  /** 품목 코드 */
  code: string;
  /** 품목명 */
  name: string;
  /** 규격 */
  spec: string;
  /** 단가 */
  unitPrice: number;
}

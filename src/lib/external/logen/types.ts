/** 로젠택배 송장 발행 요청 데이터 */
export interface LogenInvoiceRequest {
  /** 발송인 이름 */
  senderName: string;
  /** 발송인 연락처 */
  senderPhone: string;
  /** 발송인 주소 */
  senderAddress: string;
  /** 수취인 이름 */
  receiverName: string;
  /** 수취인 연락처 */
  receiverPhone: string;
  /** 수취인 주소 */
  receiverAddress: string;
  /** 상품명 */
  goodsName: string;
  /** 박스 수량 */
  boxCount: number;
  /** 비고 (선택) */
  remark?: string;
}

/** 로젠택배 송장 발행 단건 응답 */
export interface LogenInvoiceResponse {
  /** 성공 여부 */
  success: boolean;
  /** 발행된 송장번호 (성공 시) */
  invoiceNumber?: string;
  /** 메시지 (실패 시 오류 내용 포함) */
  message?: string;
}

/** 로젠택배 송장 일괄 발행 응답 */
export interface LogenBulkResponse {
  /** 전체 성공 여부 */
  success: boolean;
  /** 각 건별 처리 결과 */
  results: LogenInvoiceResponse[];
  /** 성공 건수 */
  totalSuccess: number;
  /** 실패 건수 */
  totalFailed: number;
}

/** 로젠택배 배송 추적 결과 */
export interface LogenTrackingResult {
  /** 조회한 송장번호 */
  invoiceNumber: string;
  /** 현재 배송 상태 */
  status: 'received' | 'in_transit' | 'delivered' | 'returned';
  /** 배송 이력 */
  history: {
    /** 이력 발생 시각 */
    time: string;
    /** 처리 지점 */
    location: string;
    /** 상태 설명 */
    status: string;
  }[];
}

/** 로젠택배 송장 취소 응답 */
export interface LogenCancelResponse {
  /** 성공 여부 */
  success: boolean;
  /** 메시지 (실패 시 오류 내용 포함) */
  message?: string;
}

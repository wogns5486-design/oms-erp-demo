import type {
  LogenInvoiceRequest,
  LogenInvoiceResponse,
  LogenBulkResponse,
  LogenTrackingResult,
  LogenCancelResponse,
} from './types';

/**
 * 로젠택배 Open API 인터페이스
 *
 * 송장 발행, 일괄 발행, 배송 추적, 송장 취소 기능을 제공합니다.
 */
export interface ILogenApi {
  /**
   * 단건 송장을 발행합니다.
   * @param data 송장 발행 요청 데이터
   * @returns 발행 결과 (송장번호 포함)
   */
  requestInvoice(data: LogenInvoiceRequest): Promise<LogenInvoiceResponse>;

  /**
   * 다수의 송장을 일괄 발행합니다.
   * @param data 송장 발행 요청 데이터 배열
   * @returns 전체 처리 결과 및 건별 결과
   */
  requestBulkInvoices(data: LogenInvoiceRequest[]): Promise<LogenBulkResponse>;

  /**
   * 송장번호로 배송 현황을 조회합니다.
   * @param invoiceNumber 조회할 송장번호
   * @returns 현재 배송 상태 및 이력
   */
  trackShipment(invoiceNumber: string): Promise<LogenTrackingResult>;

  /**
   * 발행된 송장을 취소합니다.
   * @param invoiceNumber 취소할 송장번호
   * @returns 취소 처리 결과
   */
  cancelInvoice(invoiceNumber: string): Promise<LogenCancelResponse>;
}

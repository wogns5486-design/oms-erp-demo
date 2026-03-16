import type { ILogenApi } from './interface';
import type {
  LogenInvoiceRequest,
  LogenInvoiceResponse,
  LogenBulkResponse,
  LogenTrackingResult,
  LogenCancelResponse,
} from './types';

/** 배송 상태 목록 */
const TRACKING_STATUSES: LogenTrackingResult['status'][] = [
  'received',
  'in_transit',
  'delivered',
  'returned',
];

/** 가짜 처리 지점 목록 */
const FAKE_LOCATIONS = [
  '서울 강남 집하장',
  '수도권 허브 터미널',
  '대전 중부 터미널',
  '부산 경남 터미널',
  '광주 호남 터미널',
];

/**
 * 지정한 밀리초만큼 대기합니다.
 * @param ms 대기 시간 (밀리초)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 오늘 날짜를 YYYYMMDD 형식으로 반환합니다.
 */
function getTodayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * 로젠택배 Open API Mock 구현체
 *
 * 실제 API 연결 없이 인터페이스와 동일한 형태의 가짜 응답을 반환합니다.
 * 개발 및 테스트 환경에서 사용합니다.
 */
export class MockLogenApi implements ILogenApi {
  /** 송장번호 생성용 내부 시퀀스 카운터 */
  private sequence = 1;

  /**
   * LOGEN-YYYYMMDD-NNNNN 형식의 송장번호를 생성합니다.
   */
  private generateInvoiceNumber(): string {
    const seq = this.sequence.toString().padStart(5, '0');
    this.sequence += 1;
    return `LOGEN-${getTodayString()}-${seq}`;
  }

  /**
   * 단건 송장을 발행합니다. (300ms 딜레이, 95% 성공률)
   * @param data 송장 발행 요청 데이터
   * @returns 발행 결과 (송장번호 포함)
   */
  async requestInvoice(data: LogenInvoiceRequest): Promise<LogenInvoiceResponse> {
    await delay(300);

    const isSuccess = Math.random() < 0.95;

    if (!isSuccess) {
      return {
        success: false,
        message: `[Mock] 송장 발행 실패: ${data.receiverName} 수취인 주소 오류`,
      };
    }

    return {
      success: true,
      invoiceNumber: this.generateInvoiceNumber(),
    };
  }

  /**
   * 다수의 송장을 일괄 발행합니다.
   * 각 건을 순차적으로 처리하고 전체 결과를 집계합니다.
   * @param data 송장 발행 요청 데이터 배열
   * @returns 전체 처리 결과 및 건별 결과
   */
  async requestBulkInvoices(data: LogenInvoiceRequest[]): Promise<LogenBulkResponse> {
    const results: LogenInvoiceResponse[] = [];

    for (const item of data) {
      const result = await this.requestInvoice(item);
      results.push(result);
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.length - totalSuccess;

    return {
      success: totalFailed === 0,
      results,
      totalSuccess,
      totalFailed,
    };
  }

  /**
   * 송장번호로 배송 현황을 조회합니다.
   * 랜덤 상태와 가짜 이력을 반환합니다.
   * @param invoiceNumber 조회할 송장번호
   * @returns 현재 배송 상태 및 이력
   */
  async trackShipment(invoiceNumber: string): Promise<LogenTrackingResult> {
    const status = TRACKING_STATUSES[Math.floor(Math.random() * TRACKING_STATUSES.length)];

    const statusLabels: Record<LogenTrackingResult['status'], string> = {
      received: '집하 완료',
      in_transit: '배송 중',
      delivered: '배송 완료',
      returned: '반송 처리',
    };

    const now = new Date();
    const history = FAKE_LOCATIONS.slice(0, Math.floor(Math.random() * 3) + 1).map(
      (location, index) => {
        const time = new Date(now.getTime() - (3 - index) * 3600 * 1000);
        return {
          time: time.toISOString(),
          location,
          status: index === 0 ? '집하 완료' : statusLabels[status],
        };
      }
    );

    return {
      invoiceNumber,
      status,
      history,
    };
  }

  /**
   * 발행된 송장을 취소합니다.
   * Mock에서는 항상 성공을 반환합니다.
   * @param invoiceNumber 취소할 송장번호
   * @returns 취소 처리 결과
   */
  async cancelInvoice(invoiceNumber: string): Promise<LogenCancelResponse> {
    return {
      success: true,
      message: `[Mock] 송장 ${invoiceNumber} 취소 완료`,
    };
  }
}

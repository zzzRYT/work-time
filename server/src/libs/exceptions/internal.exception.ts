import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base-exception.base';

/**
 * 5xx 서버 측 예외 (프로그래밍 오류, 외부 시스템 실패 등).
 * 메시지는 서버 로그/Sentry용 — 클라이언트엔 GqlExceptionFilter가
 * 일반 메시지("Internal server error")로 sanitize하여 전달한다.
 */
export class InternalException extends BaseException {
  readonly code = 'INTERNAL_ERROR';
  readonly httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
}

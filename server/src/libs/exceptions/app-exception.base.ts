import { BaseException } from './base-exception.base';

/**
 * 4xx 클라이언트 측 도메인 예외 마커.
 * GqlExceptionFilter는 httpStatus < 500인 BaseException의 message를
 * 그대로 GraphQL 응답에 노출하므로, 메시지에 민감 정보를 담지 말 것.
 */
export abstract class AppException extends BaseException {}

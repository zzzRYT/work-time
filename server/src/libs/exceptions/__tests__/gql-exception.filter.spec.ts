import { Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '../gql-exception.filter';
import { NotFoundException } from '../not-found.exception';
import { ForbiddenException } from '../forbidden.exception';

describe('GqlExceptionFilter', () => {
  let filter: GqlExceptionFilter;

  beforeEach(() => {
    filter = new GqlExceptionFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AppException은 code/httpStatus extensions와 도메인 메시지를 그대로 노출', () => {
    const result = filter.toGraphQLError(new NotFoundException('Workspace', 'abc'));

    expect(result.message).toContain('Workspace not found: abc');
    expect(result.extensions?.code).toBe('NOT_FOUND');
    expect(result.extensions?.httpStatus).toBe(404);
  });

  it('ForbiddenException은 403으로 매핑', () => {
    const result = filter.toGraphQLError(new ForbiddenException('no access'));

    expect(result.extensions?.code).toBe('FORBIDDEN');
    expect(result.extensions?.httpStatus).toBe(403);
  });

  it('일반 Error는 INTERNAL_ERROR/500 + 일반 메시지("Internal server error")로 sanitize', () => {
    const result = filter.toGraphQLError(new Error('boom: secret stack trace'));

    expect(result.extensions?.code).toBe('INTERNAL_ERROR');
    expect(result.extensions?.httpStatus).toBe(500);
    expect(result.message).toBe('Internal server error');
    expect(result.message).not.toContain('boom');
    expect(result.message).not.toContain('secret');
  });

  it('Error가 아닌 throw도 INTERNAL_ERROR로 sanitize', () => {
    const result = filter.toGraphQLError('raw string thrown');

    expect(result.message).toBe('Internal server error');
    expect(result.extensions?.code).toBe('INTERNAL_ERROR');
  });

  it('non-AppException은 서버 로그로 원본 정보를 남긴다', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error');

    filter.toGraphQLError(new Error('detailed-internal-message'));

    expect(errorSpy).toHaveBeenCalled();
  });
});

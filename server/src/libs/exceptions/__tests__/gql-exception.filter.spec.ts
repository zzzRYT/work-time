import { HttpStatus, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '../gql-exception.filter';
import { NotFoundException } from '../not-found.exception';
import { ForbiddenException } from '../forbidden.exception';
import { InternalException } from '../internal.exception';

describe('GqlExceptionFilter', () => {
  let filter: GqlExceptionFilter;

  beforeEach(() => {
    filter = new GqlExceptionFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AppException(4xx)은 code/httpStatus extensions와 도메인 메시지를 그대로 노출', () => {
    const result = filter.toGraphQLError(new NotFoundException('Workspace', 'abc'));

    expect(result.message).toContain('Workspace not found: abc');
    expect(result.extensions?.code).toBe('NOT_FOUND');
    expect(result.extensions?.httpStatus).toBe(HttpStatus.NOT_FOUND);
  });

  it('ForbiddenException은 403으로 매핑', () => {
    const result = filter.toGraphQLError(new ForbiddenException('no access'));

    expect(result.extensions?.code).toBe('FORBIDDEN');
    expect(result.extensions?.httpStatus).toBe(HttpStatus.FORBIDDEN);
  });

  it('InternalException(5xx)은 일반 메시지로 sanitize되고 원본은 로그로 남는다', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error');
    const internal = new InternalException('detailed-internal-message: server bug');

    const result = filter.toGraphQLError(internal);

    expect(result.extensions?.code).toBe('INTERNAL_ERROR');
    expect(result.extensions?.httpStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(result.message).toBe('Internal server error');
    expect(result.message).not.toContain('detailed-internal-message');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('일반 Error도 INTERNAL_ERROR/500 + 일반 메시지로 sanitize', () => {
    const result = filter.toGraphQLError(new Error('boom: secret stack trace'));

    expect(result.extensions?.code).toBe('INTERNAL_ERROR');
    expect(result.extensions?.httpStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(result.message).toBe('Internal server error');
    expect(result.message).not.toContain('boom');
    expect(result.message).not.toContain('secret');
  });

  it('Error가 아닌 값(string 등)을 throw해도 INTERNAL_ERROR로 sanitize', () => {
    const result = filter.toGraphQLError('raw string thrown');

    expect(result.message).toBe('Internal server error');
    expect(result.extensions?.code).toBe('INTERNAL_ERROR');
  });
});

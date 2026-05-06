import { GqlExceptionFilter } from '../gql-exception.filter';
import { NotFoundException } from '../not-found.exception';
import { ForbiddenException } from '../forbidden.exception';

describe('GqlExceptionFilter', () => {
  const filter = new GqlExceptionFilter();

  it('AppException을 code/extensions를 가진 GraphQLError로 변환', () => {
    const result = filter.toGraphQLError(new NotFoundException('Workspace', 'abc'));
    expect(result.message).toContain('Workspace not found: abc');
    expect(result.extensions?.code).toBe('NOT_FOUND');
    expect(result.extensions?.httpStatus).toBe(404);
  });

  it('ForbiddenException 변환', () => {
    const result = filter.toGraphQLError(new ForbiddenException('no access'));
    expect(result.extensions?.code).toBe('FORBIDDEN');
    expect(result.extensions?.httpStatus).toBe(403);
  });

  it('일반 Error는 INTERNAL_ERROR 코드로 노출', () => {
    const result = filter.toGraphQLError(new Error('boom'));
    expect(result.extensions?.code).toBe('INTERNAL_ERROR');
    expect(result.extensions?.httpStatus).toBe(500);
  });
});

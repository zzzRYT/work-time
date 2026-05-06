import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UnauthorizedException } from '~/libs/exceptions/unauthorized.exception';
import { AuthUser } from '~/libs/auth/auth.port';
import { GraphQLContext } from '~/libs/graphql/graphql-context.type';
import { currentUserFactory, CurrentUser } from '../current-user.decorator';

describe('@CurrentUser', () => {
  function makeContext(user: AuthUser | undefined): ExecutionContext {
    const gqlContext: GraphQLContext = {
      req: { headers: {}, user } as GraphQLContext['req'],
    };
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => gqlContext,
    } as unknown as GqlExecutionContext);
    return {} as ExecutionContext;
  }

  it('CurrentUser는 export된 데코레이터다', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('req.user가 있으면 그대로 반환한다', () => {
    const user: AuthUser = { id: 'u1', email: 'x@y.com' };

    const result = currentUserFactory(undefined, makeContext(user));

    expect(result).toEqual(user);
  });

  it('req.user가 없으면 UnauthorizedException을 던진다', () => {
    expect(() => currentUserFactory(undefined, makeContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});

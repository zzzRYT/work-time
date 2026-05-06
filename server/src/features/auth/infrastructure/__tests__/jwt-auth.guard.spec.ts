import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { UnauthorizedException } from '../../../../libs/exceptions/unauthorized.exception';
import { IAuthPort } from '../../../../libs/auth/auth.port';

describe('JwtAuthGuard', () => {
  function makeContext(headers: Record<string, string>): { ctx: ExecutionContext; gqlContext: { req: { headers: Record<string, string>; user?: unknown } } } {
    const gqlContext = { req: { headers } as { headers: Record<string, string>; user?: unknown } };
    const ctx = {} as ExecutionContext;
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => gqlContext,
    } as unknown as GqlExecutionContext);
    return { ctx, gqlContext };
  }

  it('Authorization 헤더가 없으면 UnauthorizedException', async () => {
    const port: IAuthPort = { verifyToken: jest.fn() };
    const guard = new JwtAuthGuard(port);
    const { ctx } = makeContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Bearer 접두사가 없으면 UnauthorizedException', async () => {
    const port: IAuthPort = { verifyToken: jest.fn() };
    const guard = new JwtAuthGuard(port);
    const { ctx } = makeContext({ authorization: 'sometoken' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('유효 토큰이면 req.user를 채우고 true를 반환', async () => {
    const port: IAuthPort = {
      verifyToken: jest.fn().mockResolvedValue({ id: 'u1', email: 'x@y.com' }),
    };
    const guard = new JwtAuthGuard(port);
    const { ctx, gqlContext } = makeContext({ authorization: 'Bearer good-token' });

    const ok = await guard.canActivate(ctx);

    expect(ok).toBe(true);
    expect(gqlContext.req.user).toEqual({ id: 'u1', email: 'x@y.com' });
    expect(port.verifyToken).toHaveBeenCalledWith('good-token');
  });
});

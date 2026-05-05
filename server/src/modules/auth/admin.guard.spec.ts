import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AdminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('AdminGuard', () => {
  const makeGuard = (workspaceRole: 'OWNER' | 'MEMBER') => {
    const req = {
      headers: {
        authorization: 'Bearer token',
        'x-workspace-id': 'workspace-1',
      },
    };
    const authService = {
      validateSupabaseToken: jest.fn().mockResolvedValue({ id: 'supabase-1' }),
      getOrCreateUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
      getWorkspaceMembership: jest.fn().mockResolvedValue({
        role: workspaceRole,
      }),
    } as unknown as AuthService;
    const gqlSpy = jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue({
        getContext: () => ({ req }),
      } as unknown as GqlExecutionContext);

    return {
      guard: new AdminGuard(authService),
      context: {} as ExecutionContext,
      gqlSpy,
      req,
      authService,
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows workspace owners', async () => {
    const { guard, context, req, authService } = makeGuard('OWNER');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(req).toMatchObject({
      user: { id: 'user-1' },
      workspaceId: 'workspace-1',
      workspaceRole: 'OWNER',
    });
    expect(authService.getWorkspaceMembership).toHaveBeenCalledWith(
      'user-1',
      'workspace-1',
    );
  });

  it('rejects non-owner workspace members', async () => {
    const { guard, context } = makeGuard('MEMBER');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('Workspace owner role required'),
    );
  });
});

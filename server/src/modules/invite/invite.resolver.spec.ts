import { ForbiddenException } from '@nestjs/common';
import { InviteResolver } from './invite.resolver';

function makeResolver() {
  const inviteService = {
    createInvite: jest.fn(),
    joinByInvite: jest.fn(),
  };
  const resolver = new InviteResolver(inviteService as any);
  const user = { id: 'user-1', name: 'Jaejin' };

  return { resolver, inviteService, user };
}

describe('InviteResolver.createInvite', () => {
  it('rejects non-owner workspace members', async () => {
    const { resolver, inviteService, user } = makeResolver();

    await expect(
      resolver.createInvite(168, user as any, 'workspace-1', 'MEMBER'),
    ).rejects.toThrow(ForbiddenException);

    expect(inviteService.createInvite).not.toHaveBeenCalled();
  });

  it('delegates invite creation for workspace owners', async () => {
    const { resolver, inviteService, user } = makeResolver();
    inviteService.createInvite.mockResolvedValue({
      id: 'invite-1',
      workspaceId: 'workspace-1',
      token: 'token-1',
      createdBy: 'user-1',
      expiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    const result = await resolver.createInvite(
      168,
      user as any,
      'workspace-1',
      'OWNER',
    );

    expect(inviteService.createInvite).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
      168,
    );
    expect(result).toMatchObject({ id: 'invite-1', token: 'token-1' });
  });
});

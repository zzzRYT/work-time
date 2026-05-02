import { BadRequestException, ConflictException } from '@nestjs/common';
import { InviteEntity } from '../../entities/invite.entity';
import { MemberEntity } from '../../entities/member.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { InviteService } from './invite.service';

function makeRepo<T>() {
  return {
    create: jest.fn((input: Partial<T>) => input),
    save: jest.fn(async (entity: Partial<T>) => entity),
    findOne: jest.fn(),
  };
}

function makeManager() {
  return {
    create: jest.fn((_entityClass: unknown, attrs: Record<string, unknown>) => ({
      ...attrs,
    })),
    save: jest.fn(async (entity: Record<string, unknown>) => {
      if ('memberId' in entity) {
        entity.id = 'membership-created';
      } else {
        entity.id = 'member-persisted';
      }
      return entity;
    }),
  };
}

function makeService() {
  const inviteRepo = makeRepo<InviteEntity>();
  const workspaceMemberRepo = makeRepo<WorkspaceMemberEntity>();
  const memberRepo = makeRepo<MemberEntity>();
  const manager = makeManager();
  const dataSource = {
    transaction: jest.fn(
      async (callback: (manager: ReturnType<typeof makeManager>) => unknown) =>
        callback(manager),
    ),
  };

  const service = new InviteService(
    inviteRepo as any,
    workspaceMemberRepo as any,
    memberRepo as any,
    dataSource as any,
  );

  return {
    service,
    inviteRepo,
    workspaceMemberRepo,
    memberRepo,
    dataSource,
    manager,
  };
}

describe('InviteService.joinByInvite', () => {
  it('rejects missing invite tokens', async () => {
    const { service, inviteRepo, dataSource, manager } = makeService();
    inviteRepo.findOne.mockResolvedValue(null);

    await expect(
      service.joinByInvite('missing-token', 'user-1', 'Jaejin'),
    ).rejects.toThrow(BadRequestException);

    expect(inviteRepo.findOne).toHaveBeenCalledWith({
      where: { token: 'missing-token' },
    });
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(manager.create).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rejects expired invite tokens', async () => {
    const { service, inviteRepo, dataSource, manager } = makeService();
    inviteRepo.findOne.mockResolvedValue({
      id: 'invite-1',
      token: 'expired-token',
      workspaceId: 'workspace-1',
      createdBy: 'owner-1',
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      service.joinByInvite('expired-token', 'user-1', 'Jaejin'),
    ).rejects.toThrow(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(manager.create).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rejects users who already belong to the invited workspace', async () => {
    const { service, inviteRepo, workspaceMemberRepo, dataSource, manager } =
      makeService();
    inviteRepo.findOne.mockResolvedValue({
      id: 'invite-1',
      token: 'valid-token',
      workspaceId: 'workspace-1',
      createdBy: 'owner-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    workspaceMemberRepo.findOne.mockResolvedValue({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
    });

    await expect(
      service.joinByInvite('valid-token', 'user-1', 'Jaejin'),
    ).rejects.toThrow(ConflictException);

    expect(workspaceMemberRepo.findOne).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1', userId: 'user-1' },
    });
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(manager.create).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('creates a member and workspace membership in one transaction', async () => {
    const { service, inviteRepo, workspaceMemberRepo, dataSource, manager } =
      makeService();
    inviteRepo.findOne.mockResolvedValue({
      id: 'invite-1',
      token: 'valid-token',
      workspaceId: 'workspace-1',
      createdBy: 'owner-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    workspaceMemberRepo.findOne.mockResolvedValue(null);

    const result = await service.joinByInvite('valid-token', 'user-1', 'Jaejin');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.create).toHaveBeenCalledWith(MemberEntity, {
      name: 'Jaejin',
      displayName: 'Jaejin',
      color: expect.stringMatching(/^#[0-9a-f]{6}$/),
      role: 'MEMBER',
      workspaceId: 'workspace-1',
    });
    expect(manager.create).toHaveBeenCalledWith(WorkspaceMemberEntity, {
      workspaceId: 'workspace-1',
      userId: 'user-1',
      memberId: 'member-persisted',
      role: 'MEMBER',
      invitedBy: 'owner-1',
    });
    expect(manager.save).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      id: 'membership-created',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      memberId: 'member-persisted',
      role: 'MEMBER',
    });
  });
});

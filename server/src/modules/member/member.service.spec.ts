import { ForbiddenException } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberAccessDeniedError } from './errors/member-access-denied.error';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    ...overrides,
  };
}

describe('MemberService.ensureMemberInWorkspace', () => {
  it('returns the member when it belongs to the workspace', async () => {
    const memberRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue({
        id: 'member-1',
        workspaceId: 'workspace-1',
      }),
    });
    const service = new MemberService(
      memberRepo as any,
      makeRepo() as any,
      makeRepo() as any,
      makeRepo() as any,
    );

    await expect(
      service.ensureMemberInWorkspace('member-1', 'workspace-1'),
    ).resolves.toEqual({ id: 'member-1', workspaceId: 'workspace-1' });

    expect(memberRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'member-1', workspaceId: 'workspace-1' },
    });
  });

  it('throws ForbiddenException when the member is outside the workspace', async () => {
    const memberRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const service = new MemberService(
      memberRepo as any,
      makeRepo() as any,
      makeRepo() as any,
      makeRepo() as any,
    );

    const result = service.ensureMemberInWorkspace('member-1', 'workspace-2');

    await expect(result).rejects.toBeInstanceOf(MemberAccessDeniedError);
    await expect(result).rejects.toThrow(
      'Member does not belong to this workspace',
    );
  });
});

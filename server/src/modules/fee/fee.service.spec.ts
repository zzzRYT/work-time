import { FeeService } from './fee.service';
import { FeeType } from './enums/fee-type.enum';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => ({ ...value })),
    ...overrides,
  };
}

function makeService(feeRepo = makeRepo(), memberService = makeMemberService()) {
  return new FeeService(
    makeRepo() as any,
    makeRepo() as any,
    feeRepo as any,
    { getSettings: jest.fn() } as any,
    memberService as any,
  );
}

function makeMemberService(overrides: Record<string, jest.Mock> = {}) {
  return {
    ensureMemberInWorkspace: jest.fn().mockResolvedValue({
      id: 'member-1',
      workspaceId: 'workspace-1',
    }),
    ...overrides,
  };
}

describe('FeeService workspace scope', () => {
  it('creates monthly fee rows with workspaceId after member validation', async () => {
    const feeRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const memberService = makeMemberService();
    const service = makeService(feeRepo, memberService);

    const result = await service.requestFeePayment(
      'member-1',
      'workspace-1',
      '2026-04',
      FeeType.MONTHLY,
    );

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(feeRepo.findOne).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        month: '2026-04',
      },
    });
    expect(feeRepo.create).toHaveBeenCalledWith({
      memberId: 'member-1',
      workspaceId: 'workspace-1',
      month: '2026-04',
      monthlyFeeStatus: 'UNPAID',
      lateFeeStatus: 'UNPAID',
    });
    expect(result.workspaceId).toBe('workspace-1');
    expect(result.monthlyFeeStatus).toBe('PENDING');
  });

  it('finds existing monthly fee rows by memberId, workspaceId, and month', async () => {
    const existingFee = {
      memberId: 'member-1',
      workspaceId: 'workspace-1',
      month: '2026-04',
      monthlyFeeStatus: 'PENDING',
      lateFeeStatus: 'UNPAID',
    };
    const feeRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue(existingFee),
    });
    const service = makeService(feeRepo);

    const result = await service.confirmFeePayment(
      'member-1',
      'workspace-1',
      '2026-04',
      FeeType.MONTHLY,
    );

    expect(feeRepo.findOne).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        month: '2026-04',
      },
    });
    expect(feeRepo.create).not.toHaveBeenCalled();
    expect(result.monthlyFeeStatus).toBe('PAID');
  });

  it.each([
    ['requestFeePayment', 'UNPAID', 'PENDING'],
    ['confirmFeePayment', 'PENDING', 'PAID'],
    ['rejectFeePayment', 'PENDING', 'UNPAID'],
  ] as const)(
    '%s validates the member workspace before changing fee state',
    async (methodName, initialStatus, expectedStatus) => {
      const feeRepo = makeRepo({
        findOne: jest.fn().mockResolvedValue({
          memberId: 'member-1',
          workspaceId: 'workspace-1',
          month: '2026-04',
          monthlyFeeStatus: initialStatus,
          lateFeeStatus: 'UNPAID',
        }),
      });
      const memberService = makeMemberService();
      const service = makeService(feeRepo, memberService);

      const result = await service[methodName](
        'member-1',
        'workspace-1',
        '2026-04',
        FeeType.MONTHLY,
      );

      expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
        'member-1',
        'workspace-1',
      );
      expect(result.monthlyFeeStatus).toBe(expectedStatus);
    },
  );

  it('does not read or save fee state when member workspace validation fails', async () => {
    const feeRepo = makeRepo();
    const memberService = makeMemberService({
      ensureMemberInWorkspace: jest
        .fn()
        .mockRejectedValue(new Error('forbidden')),
    });
    const service = makeService(feeRepo, memberService);

    await expect(
      service.requestFeePayment(
        'member-1',
        'workspace-1',
        '2026-04',
        FeeType.MONTHLY,
      ),
    ).rejects.toThrow('forbidden');

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(feeRepo.findOne).not.toHaveBeenCalled();
    expect(feeRepo.create).not.toHaveBeenCalled();
    expect(feeRepo.save).not.toHaveBeenCalled();
  });
});

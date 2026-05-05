import { In, IsNull } from 'typeorm';
import { VacationService } from './vacation.service';
import { InvalidDateFormatError } from './errors/invalid-date-format.error';
import { InvalidVacationHoursError } from './errors/vacation.error';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => value),
    delete: jest.fn(),
    ...overrides,
  };
}

function makeMemberService() {
  return {
    ensureMemberInWorkspace: jest.fn().mockResolvedValue({
      id: 'member-1',
      workspaceId: 'workspace-1',
    }),
  };
}

describe('VacationService workspace scope', () => {
  it('validates member workspace and saves workspaceId for a vacation', async () => {
    const memberService = makeMemberService();
    const sessionRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(null) });
    const vacationRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(null) });
    const service = new VacationService(
      sessionRepo as any,
      vacationRepo as any,
      memberService as any,
    );

    const result = await service.useVacation(
      'member-1',
      'workspace-1',
      '2026-04-25',
      8,
    );

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(vacationRepo.findOne).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        date: '2026-04-25',
      },
    });
    expect(sessionRepo.findOne).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        date: '2026-04-25',
        checkOutTime: IsNull(),
      },
    });
    expect(vacationRepo.create).toHaveBeenCalledWith({
      memberId: 'member-1',
      workspaceId: 'workspace-1',
      date: '2026-04-25',
      hours: 8,
    });
    expect(result.workspaceId).toBe('workspace-1');
  });

  it('filters existing vacations and active sessions by workspace during bulk creation', async () => {
    const memberService = makeMemberService();
    const sessionRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(null) });
    const vacationRepo = makeRepo({ find: jest.fn().mockResolvedValue([]) });
    const service = new VacationService(
      sessionRepo as any,
      vacationRepo as any,
      memberService as any,
    );

    const result = await service.useVacations(
      'member-1',
      'workspace-1',
      ['2026-04-25', '2026-04-26'],
      8,
    );

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(vacationRepo.find).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        date: In(['2026-04-25', '2026-04-26']),
      },
    });
    expect(sessionRepo.findOne).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        date: '2026-04-25',
        checkOutTime: IsNull(),
      },
    });
    expect(sessionRepo.findOne).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        date: '2026-04-26',
        checkOutTime: IsNull(),
      },
    });
    expect(vacationRepo.create).toHaveBeenCalledWith({
      memberId: 'member-1',
      workspaceId: 'workspace-1',
      date: '2026-04-25',
      hours: 8,
    });
    expect(vacationRepo.create).toHaveBeenCalledWith({
      memberId: 'member-1',
      workspaceId: 'workspace-1',
      date: '2026-04-26',
      hours: 8,
    });
    expect(result.succeeded).toHaveLength(2);
    expect(result.succeeded.every((v) => v.workspaceId === 'workspace-1')).toBe(
      true,
    );
  });

  it('deletes vacations only within the current workspace', async () => {
    const memberService = makeMemberService();
    const vacationRepo = makeRepo({
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    });
    const service = new VacationService(
      makeRepo() as any,
      vacationRepo as any,
      memberService as any,
    );

    await expect(
      service.cancelVacation('member-1', 'workspace-1', '2026-04-25'),
    ).resolves.toBe(true);

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(vacationRepo.delete).toHaveBeenCalledWith({
      memberId: 'member-1',
      workspaceId: 'workspace-1',
      date: '2026-04-25',
    });
  });

  it('keeps vacation hours validation before workspace validation', async () => {
    const memberService = makeMemberService();
    const service = new VacationService(
      makeRepo() as any,
      makeRepo() as any,
      memberService as any,
    );

    await expect(
      service.useVacation('member-1', 'workspace-1', '2026-04-25', 3),
    ).rejects.toBeInstanceOf(InvalidVacationHoursError);
    expect(memberService.ensureMemberInWorkspace).not.toHaveBeenCalled();
  });

  it('keeps date validation before workspace validation', async () => {
    const memberService = makeMemberService();
    const service = new VacationService(
      makeRepo() as any,
      makeRepo() as any,
      memberService as any,
    );

    await expect(
      service.cancelVacation('member-1', 'workspace-1', '04/25/2026'),
    ).rejects.toBeInstanceOf(InvalidDateFormatError);
    expect(memberService.ensureMemberInWorkspace).not.toHaveBeenCalled();
  });
});

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { deriveStatus } from '../session/utils/attendance.util';
import { getKSTToday } from '../../common/utils/date.util';
import { calculateDurationMinutes } from '../../common/utils/duration.util';
import { MemberAccessDeniedError } from './errors/member-access-denied.error';
import { AttendanceStatus } from '../../common/enums';

export type MemberWithTodayData = MemberEntity & {
  currentStatus: AttendanceStatus;
  todayStudyMinutes: number;
  todayVacationHours: number | null;
};

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(DailyVacationEntity)
    private readonly vacationRepo: Repository<DailyVacationEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepo: Repository<WorkspaceMemberEntity>,
  ) {}

  async ensureMemberInWorkspace(
    memberId: string,
    workspaceId: string,
  ): Promise<MemberEntity> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new MemberAccessDeniedError();
    }

    return member;
  }

  async findAll(workspaceId: string): Promise<MemberWithTodayData[]> {
    const today = getKSTToday();

    const [members, ownerEntries, todaySessions, todayVacations] = await Promise.all([
      this.memberRepo.find({ where: { workspaceId }, order: { createdAt: 'ASC' } }),
      this.workspaceMemberRepo.find({ where: { workspaceId, role: 'OWNER' }, select: ['memberId'] }),
      this.sessionRepo.find({ where: { workspaceId, date: today } }),
      this.vacationRepo.find({ where: { workspaceId, date: today } }),
    ]);

    const ownerMemberIds = new Set(ownerEntries.map((e) => e.memberId));

    const sessionsByMember = new Map<string, SessionEntity[]>();
    for (const session of todaySessions) {
      const list = sessionsByMember.get(session.memberId) ?? [];
      list.push(session);
      sessionsByMember.set(session.memberId, list);
    }

    const vacationByMember = new Map<string, DailyVacationEntity>();
    for (const vacation of todayVacations) {
      vacationByMember.set(vacation.memberId, vacation);
    }

    return members.map((m) => {
      const sessions = sessionsByMember.get(m.id) ?? [];
      const vacation = vacationByMember.get(m.id) ?? null;
      return {
        ...(ownerMemberIds.has(m.id) ? { ...m, role: 'ADMIN' } : m),
        currentStatus: deriveStatus(sessions, vacation),
        todayStudyMinutes: sessions.reduce((sum, s) => sum + calculateDurationMinutes(s.checkInTime, s.checkOutTime), 0),
        todayVacationHours: vacation?.hours ?? null,
      };
    });
  }

  async getCurrentStatus(memberId: string) {
    const today = getKSTToday();
    const [sessions, vacation] = await Promise.all([
      this.sessionRepo.find({
        where: { memberId, date: today },
        order: { checkInTime: 'ASC' },
      }),
      this.vacationRepo.findOne({
        where: { memberId, date: today },
      }),
    ]);
    return deriveStatus(sessions, vacation);
  }

  async getTodayStudyMinutes(memberId: string): Promise<number> {
    const today = getKSTToday();
    const sessions = await this.sessionRepo.find({
      where: { memberId, date: today },
    });

    return sessions.reduce((sum, s) => {
      return sum + calculateDurationMinutes(s.checkInTime, s.checkOutTime);
    }, 0);
  }

  async getTodayVacationHours(memberId: string): Promise<number | null> {
    const today = getKSTToday();
    const vacation = await this.vacationRepo.findOne({
      where: { memberId, date: today },
    });
    return vacation?.hours ?? null;
  }
}

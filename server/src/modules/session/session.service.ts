import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { SessionEntity } from '../../entities/session.entity';
import { MemberEntity } from '../../entities/member.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { SettingsService } from '../settings/settings.service';
import { getKSTToday, getMonthDateRange } from '../../common/utils/date.util';
import { calculateDurationMinutes } from '../../common/utils/duration.util';
import { isLateCheckIn } from './utils/attendance.util';
import { buildCalendar } from './utils/calendar.util';
import { FULL_DAY_VACATION_HOURS } from '../../common/constants';
import { countLateDays } from '../../common/utils/session.util';
import {
  FullDayVacationError,
  AlreadyCheckedInError,
  NotCheckedInError,
} from './errors/session.error';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(DailyVacationEntity)
    private readonly vacationRepo: Repository<DailyVacationEntity>,
    private readonly settingsService: SettingsService,
  ) {}

  async getActiveSession(memberId: string) {
    const today = getKSTToday();
    return this.sessionRepo.findOne({
      where: { memberId, date: today, checkOutTime: IsNull() },
    });
  }

  async getTodayAttendanceSummary(workspaceId: string) {
    const today = getKSTToday();
    const total = await this.memberRepo.count({ where: { workspaceId } });

    const todaySessions = await this.sessionRepo.find({
      where: { date: today, workspaceId },
    });

    const memberSessions = new Map<string, SessionEntity[]>();
    for (const s of todaySessions) {
      const arr = memberSessions.get(s.memberId) ?? [];
      arr.push(s);
      memberSessions.set(s.memberId, arr);
    }

    let attended = 0;
    let studying = 0;
    let late = 0;

    for (const [, sessions] of memberSessions) {
      attended++;
      if (sessions.some((s) => s.checkOutTime === null)) {
        studying++;
      }
      const first = sessions.sort(
        (a, b) => a.checkInTime.getTime() - b.checkInTime.getTime(),
      )[0];
      if (first.isLate) late++;
    }

    return { total, attended, studying, late };
  }

  async getDayDetail(memberId: string, date: string) {
    const sessions = await this.sessionRepo.find({
      where: { memberId, date },
      order: { checkInTime: 'ASC' },
    });

    const vacation = await this.vacationRepo.findOne({
      where: { memberId, date },
    });

    const totalDurationMinutes = sessions.reduce(
      (sum, s) =>
        sum + calculateDurationMinutes(s.checkInTime, s.checkOutTime),
      0,
    );

    return {
      sessions,
      totalDurationMinutes,
      vacationHours: vacation?.hours ?? null,
    };
  }

  async getCalendar(memberId: string, year: number, month: number) {
    const { start, end } = getMonthDateRange(year, month);

    const [sessions, vacations] = await Promise.all([
      this.sessionRepo.find({
        where: { memberId, date: Between(start, end) },
        order: { checkInTime: 'ASC' },
      }),
      this.vacationRepo.find({
        where: { memberId, date: Between(start, end) },
      }),
    ]);

    return buildCalendar(year, month, sessions, vacations);
  }

  async getMonthlySummary(memberId: string, year: number, month: number, workspaceId: string) {
    const { start, end } = getMonthDateRange(year, month);

    const [sessions, vacations] = await Promise.all([
      this.sessionRepo.find({
        where: { memberId, date: Between(start, end) },
        order: { checkInTime: 'ASC' },
      }),
      this.vacationRepo.find({
        where: { memberId, date: Between(start, end) },
      }),
    ]);

    const uniqueDates = new Set(sessions.map((s) => s.date));
    const attendanceDays = uniqueDates.size;

    const totalStudyMinutes = sessions.reduce(
      (sum, s) =>
        sum +
        (s.checkOutTime
          ? calculateDurationMinutes(s.checkInTime, s.checkOutTime)
          : 0),
      0,
    );

    const averageDailyMinutes =
      attendanceDays > 0
        ? Math.floor(totalStudyMinutes / attendanceDays)
        : 0;

    const lateCount = countLateDays(sessions);

    const vacationDays = vacations.length;
    const settings = await this.settingsService.getSettings(workspaceId);
    const totalLateFee = lateCount * settings.lateFeeAmount;

    return {
      attendanceDays,
      totalStudyMinutes,
      averageDailyMinutes,
      lateCount,
      vacationDays,
      totalLateFee,
    };
  }

  async checkIn(memberId: string, workspaceId: string) {
    const today = getKSTToday();

    const vacation = await this.vacationRepo.findOne({
      where: { memberId, date: today },
    });
    if (vacation && vacation.hours >= FULL_DAY_VACATION_HOURS) {
      throw new FullDayVacationError();
    }

    const activeSession = await this.sessionRepo.findOne({
      where: { memberId, date: today, checkOutTime: IsNull() },
    });
    if (activeSession) {
      throw new AlreadyCheckedInError();
    }

    const existingSessions = await this.sessionRepo.find({
      where: { memberId, date: today },
    });

    const now = new Date();
    const settings = await this.settingsService.getSettings(workspaceId);
    const isLate = isLateCheckIn(
      now,
      existingSessions,
      settings.studyStartHour,
      settings.studyStartMinute,
    );

    const session = this.sessionRepo.create({
      memberId,
      date: today,
      checkInTime: now,
      isLate,
      workspaceId,
    });
    return this.sessionRepo.save(session);
  }

  async checkOut(memberId: string) {
    const today = getKSTToday();

    const activeSession = await this.sessionRepo.findOne({
      where: { memberId, date: today, checkOutTime: IsNull() },
    });

    if (!activeSession) {
      throw new NotCheckedInError();
    }

    activeSession.checkOutTime = new Date();
    return this.sessionRepo.save(activeSession);
  }
}

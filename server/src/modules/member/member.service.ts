import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { deriveStatus } from '../session/utils/attendance.util';
import { getKSTToday } from '../../common/utils/date.util';
import { calculateDurationMinutes } from '../../common/utils/duration.util';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(DailyVacationEntity)
    private readonly vacationRepo: Repository<DailyVacationEntity>,
  ) {}

  async findAll() {
    return this.memberRepo.find({ order: { createdAt: 'ASC' } });
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

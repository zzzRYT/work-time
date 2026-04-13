import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { FULL_DAY_VACATION_HOURS } from '../../common/constants';
import { VACATION_UNITS } from './vacation.constants';
import { MemberNotFoundError } from '../member/errors/member-not-found.error';
import { InvalidDateFormatError } from './errors/invalid-date-format.error';
import {
  InvalidVacationHoursError,
  VacationAlreadyExistsError,
  ActiveSessionExistsError,
  VacationNotFoundError,
} from './errors/vacation.error';

@Injectable()
export class VacationService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(DailyVacationEntity)
    private readonly vacationRepo: Repository<DailyVacationEntity>,
  ) {}

  private validateVacationHours(hours: number) {
    if (!VACATION_UNITS.includes(hours as (typeof VACATION_UNITS)[number])) {
      throw new InvalidVacationHoursError();
    }
  }

  private validateDateFormat(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new InvalidDateFormatError();
    }
  }

  private async ensureMemberExists(memberId: string) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
    });
    if (!member) {
      throw new MemberNotFoundError();
    }
  }

  async useVacation(memberId: string, date: string, hours: number) {
    this.validateVacationHours(hours);
    this.validateDateFormat(date);
    await this.ensureMemberExists(memberId);

    const existing = await this.vacationRepo.findOne({
      where: { memberId, date },
    });
    if (existing) {
      throw new VacationAlreadyExistsError();
    }

    if (hours >= FULL_DAY_VACATION_HOURS) {
      const activeSession = await this.sessionRepo.findOne({
        where: { memberId, date, checkOutTime: IsNull() },
      });
      if (activeSession) {
        throw new ActiveSessionExistsError();
      }
    }

    const vacation = this.vacationRepo.create({ memberId, date, hours });
    return this.vacationRepo.save(vacation);
  }

  async useVacations(memberId: string, dates: string[], hours: number) {
    this.validateVacationHours(hours);
    for (const date of dates) {
      this.validateDateFormat(date);
    }
    await this.ensureMemberExists(memberId);

    const existingVacations = await this.vacationRepo.find({
      where: { memberId, date: In(dates) },
    });
    const existingDates = new Set(existingVacations.map((v) => v.date));

    const succeeded: Array<{
      id: string;
      memberId: string;
      date: string;
      hours: number;
    }> = [];
    const failed: Array<{ date: string; reason: string }> = [];

    for (const date of dates) {
      if (existingDates.has(date)) {
        failed.push({
          date,
          reason: '이미 해당 날짜에 휴가가 등록되어 있습니다.',
        });
        continue;
      }

      try {
        if (hours >= FULL_DAY_VACATION_HOURS) {
          const activeSession = await this.sessionRepo.findOne({
            where: { memberId, date, checkOutTime: IsNull() },
          });
          if (activeSession) {
            failed.push({
              date,
              reason: '공부 중에는 전일 휴가를 사용할 수 없습니다.',
            });
            continue;
          }
        }

        const vacation = this.vacationRepo.create({ memberId, date, hours });
        const saved = await this.vacationRepo.save(vacation);
        succeeded.push(saved);
      } catch {
        failed.push({ date, reason: '휴가 등록에 실패했습니다.' });
      }
    }

    return { succeeded, failed };
  }

  async cancelVacation(memberId: string, date: string) {
    this.validateDateFormat(date);
    await this.ensureMemberExists(memberId);

    const result = await this.vacationRepo.delete({ memberId, date });
    if (result.affected === 0) {
      throw new VacationNotFoundError();
    }

    return true;
  }
}

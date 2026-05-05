import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { MonthlyFeeEntity } from '../../entities/monthly-fee.entity';
import { SettingsService } from '../settings/settings.service';
import { MemberService } from '../member/member.service';
import {
  getMonthDateRange,
  getWeekDateRange,
  getKSTToday,
} from '../../common/utils/date.util';
import { buildRanking } from './utils/ranking.util';
import { RankingPeriod } from './enums/ranking-period.enum';
import { FeeType } from './enums/fee-type.enum';
import {
  InvalidMonthFormatError,
  InvalidStatusTransitionError,
} from './errors/fee.error';
import { countLateDays } from '../../common/utils/session.util';

function getStatusField(type: FeeType): 'monthlyFeeStatus' | 'lateFeeStatus' {
  return type === 'MONTHLY' ? 'monthlyFeeStatus' : 'lateFeeStatus';
}

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(MonthlyFeeEntity)
    private readonly feeRepo: Repository<MonthlyFeeEntity>,
    private readonly settingsService: SettingsService,
    private readonly memberService: MemberService,
  ) {}

  private validateMonthFormat(month: string) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new InvalidMonthFormatError();
    }
  }

  private async getOrCreateMonthlyFee(
    memberId: string,
    workspaceId: string,
    month: string,
  ) {
    const existing = await this.feeRepo.findOne({
      where: { memberId, workspaceId, month },
    });
    if (existing) return existing;

    const fee = this.feeRepo.create({
      memberId,
      workspaceId,
      month,
      monthlyFeeStatus: 'UNPAID',
      lateFeeStatus: 'UNPAID',
    });
    return this.feeRepo.save(fee);
  }

  async getFeeStatus(month: string, workspaceId: string) {
    const [yearStr, monthStr] = month.split('-');
    const { start, end } = getMonthDateRange(Number(yearStr), Number(monthStr));

    const [members, allSessions, allFees, settings] = await Promise.all([
      this.memberRepo.find({ where: { workspaceId }, order: { createdAt: 'ASC' } }),
      this.sessionRepo.find({
        where: { date: Between(start, end), workspaceId },
        order: { checkInTime: 'ASC' },
      }),
      this.feeRepo.find({ where: { month, workspaceId } }),
      this.settingsService.getSettings(workspaceId),
    ]);

    const feeMap = new Map(allFees.map((f) => [f.memberId, f]));

    return members.map((member) => {
      const sessions = allSessions.filter((s) => s.memberId === member.id);

      const lateCount = countLateDays(sessions);

      const fee = feeMap.get(member.id);

      return {
        member,
        lateFee: lateCount * settings.lateFeeAmount,
        monthlyFee: settings.monthlyFeeAmount,
        monthlyFeeStatus: fee?.monthlyFeeStatus ?? 'UNPAID',
        lateFeeStatus: fee?.lateFeeStatus ?? 'UNPAID',
        lateCount,
      };
    });
  }

  async getMemberRanking(period: RankingPeriod, workspaceId: string) {
    let start: string;
    let end: string;

    if (period === RankingPeriod.WEEKLY) {
      const range = getWeekDateRange();
      start = range.start;
      end = range.end;
    } else {
      const today = getKSTToday();
      const [y, m] = today.split('-').map(Number);
      const range = getMonthDateRange(y, m);
      start = range.start;
      end = range.end;
    }

    const [members, sessions] = await Promise.all([
      this.memberRepo.find({ where: { workspaceId } }),
      this.sessionRepo.find({
        where: { date: Between(start, end), workspaceId },
        order: { checkInTime: 'ASC' },
      }),
    ]);

    return buildRanking(members, sessions);
  }

  async requestFeePayment(
    memberId: string,
    workspaceId: string,
    month: string,
    type: FeeType,
  ) {
    this.validateMonthFormat(month);
    await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);
    const fee = await this.getOrCreateMonthlyFee(memberId, workspaceId, month);
    const field = getStatusField(type);

    if (fee[field] !== 'UNPAID') {
      throw new InvalidStatusTransitionError(fee[field], 'request');
    }

    fee[field] = 'PENDING';
    return this.feeRepo.save(fee);
  }

  async confirmFeePayment(
    memberId: string,
    workspaceId: string,
    month: string,
    type: FeeType,
  ) {
    this.validateMonthFormat(month);
    await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);
    const fee = await this.getOrCreateMonthlyFee(memberId, workspaceId, month);
    const field = getStatusField(type);

    if (fee[field] !== 'PENDING') {
      throw new InvalidStatusTransitionError(fee[field], 'confirm');
    }

    fee[field] = 'PAID';
    return this.feeRepo.save(fee);
  }

  async rejectFeePayment(
    memberId: string,
    workspaceId: string,
    month: string,
    type: FeeType,
  ) {
    this.validateMonthFormat(month);
    await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);
    const fee = await this.getOrCreateMonthlyFee(memberId, workspaceId, month);
    const field = getStatusField(type);

    if (fee[field] !== 'PENDING') {
      throw new InvalidStatusTransitionError(fee[field], 'reject');
    }

    fee[field] = 'UNPAID';
    return this.feeRepo.save(fee);
  }
}

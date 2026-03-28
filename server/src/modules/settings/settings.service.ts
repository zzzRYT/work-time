import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SettingsEntity } from '../../entities/settings.entity';
import { MemberEntity } from '../../entities/member.entity';
import { MemberNotFoundError } from '../member/errors/member-not-found.error';
import {
  InvalidRoleError,
  LastAdminError,
  InvalidHourError,
  InvalidMinuteError,
  InvalidAmountError,
} from './errors/settings.error';

const VALID_ROLES = ['ADMIN', 'MEMBER'] as const;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly settingsRepo: Repository<SettingsEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getSettings(): Promise<SettingsEntity> {
    let settings = await this.settingsRepo.findOne({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 'default',
        studyStartHour: 10,
        studyStartMinute: 0,
        lateFeeAmount: 1000,
        monthlyFeeAmount: 10000,
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateMemberRole(memberId: string, role: string) {
    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      throw new InvalidRoleError();
    }

    return this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(MemberEntity);

      const member = await memberRepo.findOne({
        where: { id: memberId },
      });
      if (!member) {
        throw new MemberNotFoundError();
      }

      if (member.role === 'ADMIN' && role === 'MEMBER') {
        const adminCount = await memberRepo.count({
          where: { role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          throw new LastAdminError();
        }
      }

      member.role = role;
      return memberRepo.save(member);
    });
  }

  async updateStudyStartTime(hour: number, minute: number) {
    if (hour < 0 || hour > 23) {
      throw new InvalidHourError();
    }
    if (minute < 0 || minute > 59) {
      throw new InvalidMinuteError();
    }

    let settings = await this.settingsRepo.findOne({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 'default',
        studyStartHour: hour,
        studyStartMinute: minute,
        lateFeeAmount: 1000,
        monthlyFeeAmount: 10000,
      });
    } else {
      settings.studyStartHour = hour;
      settings.studyStartMinute = minute;
    }
    return this.settingsRepo.save(settings);
  }

  async updateLateFeeAmount(amount: number) {
    if (amount < 0) {
      throw new InvalidAmountError();
    }

    let settings = await this.settingsRepo.findOne({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 'default',
        studyStartHour: 10,
        studyStartMinute: 0,
        lateFeeAmount: amount,
        monthlyFeeAmount: 10000,
      });
    } else {
      settings.lateFeeAmount = amount;
    }
    return this.settingsRepo.save(settings);
  }

  async updateMonthlyFeeAmount(amount: number) {
    if (amount < 0) {
      throw new InvalidAmountError();
    }

    let settings = await this.settingsRepo.findOne({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 'default',
        studyStartHour: 10,
        studyStartMinute: 0,
        lateFeeAmount: 1000,
        monthlyFeeAmount: amount,
      });
    } else {
      settings.monthlyFeeAmount = amount;
    }
    return this.settingsRepo.save(settings);
  }
}

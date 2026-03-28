import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { SessionService } from './session.service';
import { SessionResolver } from './session.resolver';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, SessionEntity, DailyVacationEntity]),
    SettingsModule,
  ],
  providers: [SessionService, SessionResolver],
})
export class SessionModule {}

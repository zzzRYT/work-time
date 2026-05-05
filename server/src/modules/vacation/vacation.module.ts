import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { MemberModule } from '../member/member.module';
import { VacationService } from './vacation.service';
import { VacationResolver } from './vacation.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity, DailyVacationEntity]),
    MemberModule,
  ],
  providers: [VacationService, VacationResolver],
})
export class VacationModule {}

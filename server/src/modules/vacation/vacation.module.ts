import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { VacationService } from './vacation.service';
import { VacationResolver } from './vacation.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, SessionEntity, DailyVacationEntity]),
  ],
  providers: [VacationService, VacationResolver],
})
export class VacationModule {}

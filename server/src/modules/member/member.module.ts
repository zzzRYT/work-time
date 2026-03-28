import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { MemberService } from './member.service';
import { MemberResolver } from './member.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, SessionEntity, DailyVacationEntity]),
  ],
  providers: [MemberService, MemberResolver],
  exports: [MemberService],
})
export class MemberModule {}

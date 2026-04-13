import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { MonthlyFeeEntity } from '../../entities/monthly-fee.entity';
import { FeeService } from './fee.service';
import { FeeResolver } from './fee.resolver';
import { SettingsModule } from '../settings/settings.module';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, SessionEntity, MonthlyFeeEntity]),
    SettingsModule,
    MemberModule,
  ],
  providers: [FeeService, FeeResolver],
})
export class FeeModule {}

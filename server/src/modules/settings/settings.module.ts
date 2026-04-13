import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SettingsEntity } from '../../entities/settings.entity';
import { SettingsService } from './settings.service';
import { SettingsResolver } from './settings.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([SettingsEntity, MemberEntity])],
  providers: [SettingsService, SettingsResolver],
  exports: [SettingsService],
})
export class SettingsModule {}

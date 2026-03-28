import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import type { SettingsEntity } from '../../entities/settings.entity';
import { Settings } from './dto/settings.object';
import { SettingsService } from './settings.service';
import { MemberRole } from '../member/enums/member-role.enum';
import { Member } from '../member/dto/member.object';

@Resolver(() => Settings)
export class SettingsResolver {
  constructor(private readonly settingsService: SettingsService) {}

  @Query(() => Settings, { description: '현재 설정 조회' })
  async settings(): Promise<SettingsEntity> {
    return this.settingsService.getSettings();
  }

  @Mutation(() => Member, { description: '멤버 역할 변경 (ADMIN 또는 MEMBER)' })
  async updateMemberRole(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('role', { type: () => MemberRole }) role: MemberRole,
  ) {
    return this.settingsService.updateMemberRole(memberId, role);
  }

  @Mutation(() => Settings, { description: '출근 시간 변경' })
  async updateStudyStartTime(
    @Args('hour', { type: () => Int }) hour: number,
    @Args('minute', { type: () => Int }) minute: number,
  ): Promise<SettingsEntity> {
    return this.settingsService.updateStudyStartTime(hour, minute);
  }

  @Mutation(() => Settings, { description: '지각비 변경' })
  async updateLateFeeAmount(
    @Args('amount', { type: () => Int }) amount: number,
  ): Promise<SettingsEntity> {
    return this.settingsService.updateLateFeeAmount(amount);
  }

  @Mutation(() => Settings, { description: '월회비 변경' })
  async updateMonthlyFeeAmount(
    @Args('amount', { type: () => Int }) amount: number,
  ): Promise<SettingsEntity> {
    return this.settingsService.updateMonthlyFeeAmount(amount);
  }

  @ResolveField(() => String, { description: '마지막 수정 시각' })
  updatedAt(@Parent() settings: SettingsEntity): string {
    return settings.updatedAt.toISOString();
  }
}

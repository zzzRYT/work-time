import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { SettingsEntity } from '../../entities/settings.entity';
import { Settings } from './dto/settings.object';
import { SettingsService } from './settings.service';
import { MemberRole } from '../member/enums/member-role.enum';
import { Member } from '../member/dto/member.object';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';

@Resolver(() => Settings)
export class SettingsResolver {
  constructor(private readonly settingsService: SettingsService) {}

  @Query(() => Settings, { description: '현재 설정 조회' })
  @UseGuards(WorkspaceGuard)
  async settings(
    @CurrentWorkspace() workspaceId: string,
  ): Promise<SettingsEntity> {
    return this.settingsService.getSettings(workspaceId);
  }

  @Mutation(() => Member, { description: '멤버 역할 변경 (ADMIN 또는 MEMBER)' })
  @UseGuards(AdminGuard)
  async updateMemberRole(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('role', { type: () => MemberRole }) role: MemberRole,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.settingsService.updateMemberRole(memberId, role, workspaceId);
  }

  @Mutation(() => Settings, { description: '출근 시간 변경' })
  @UseGuards(AdminGuard)
  async updateStudyStartTime(
    @Args('hour', { type: () => Int }) hour: number,
    @Args('minute', { type: () => Int }) minute: number,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<SettingsEntity> {
    return this.settingsService.updateStudyStartTime(workspaceId, hour, minute);
  }

  @Mutation(() => Settings, { description: '지각비 변경' })
  @UseGuards(AdminGuard)
  async updateLateFeeAmount(
    @Args('amount', { type: () => Int }) amount: number,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<SettingsEntity> {
    return this.settingsService.updateLateFeeAmount(workspaceId, amount);
  }

  @Mutation(() => Settings, { description: '월회비 변경' })
  @UseGuards(AdminGuard)
  async updateMonthlyFeeAmount(
    @Args('amount', { type: () => Int }) amount: number,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<SettingsEntity> {
    return this.settingsService.updateMonthlyFeeAmount(workspaceId, amount);
  }

  @ResolveField(() => String, { description: '마지막 수정 시각' })
  updatedAt(@Parent() settings: SettingsEntity): string {
    return settings.updatedAt.toISOString();
  }
}

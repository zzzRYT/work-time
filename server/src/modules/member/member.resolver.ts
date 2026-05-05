import { Resolver, Query, ResolveField, Parent, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Member } from './dto/member.object';
import { MemberService, MemberWithTodayData } from './member.service';
import { AttendanceStatus } from '../../common/enums';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';

@Resolver(() => Member)
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Query(() => [Member], { description: '전체 멤버 목록 조회' })
  @UseGuards(WorkspaceGuard)
  async members(@CurrentWorkspace() workspaceId: string): Promise<MemberWithTodayData[]> {
    return this.memberService.findAll(workspaceId);
  }

  @ResolveField(() => AttendanceStatus, { description: '오늘의 출석 상태' })
  currentStatus(@Parent() member: MemberWithTodayData): AttendanceStatus {
    return member.currentStatus;
  }

  @ResolveField(() => Int, { description: '오늘 총 학습 시간(분)' })
  todayStudyMinutes(@Parent() member: MemberWithTodayData): number {
    return member.todayStudyMinutes;
  }

  @ResolveField(() => Int, { nullable: true, description: '오늘 휴가 시간 (null이면 휴가 없음)' })
  todayVacationHours(@Parent() member: MemberWithTodayData): number | null {
    return member.todayVacationHours;
  }
}

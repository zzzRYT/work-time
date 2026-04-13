import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { SessionEntity } from '../../entities/session.entity';
import { Session } from './dto/session.object';
import { AttendanceSummary } from './dto/attendance-summary.object';
import { DayDetailResult } from './dto/day-detail.object';
import { CalendarDay } from './dto/calendar-day.object';
import { MonthlySummaryResult } from './dto/monthly-summary.object';
import { SessionService } from './session.service';
import { calculateDurationMinutes } from '../../common/utils/duration.util';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';

@Resolver(() => Session)
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => Session, {
    nullable: true,
    description: '해당 멤버의 오늘 활성 세션 (체크아웃 전). 없으면 null',
  })
  @UseGuards(WorkspaceGuard)
  async activeSession(
    @Args('memberId', { type: () => ID }) memberId: string,
  ): Promise<SessionEntity | null> {
    return this.sessionService.getActiveSession(memberId);
  }

  @Query(() => AttendanceSummary, { description: '오늘의 출석 요약' })
  @UseGuards(WorkspaceGuard)
  async todayAttendanceSummary(
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.sessionService.getTodayAttendanceSummary(workspaceId);
  }

  @Query(() => DayDetailResult, { description: '특정 멤버의 특정 날짜 상세 조회' })
  @UseGuards(WorkspaceGuard)
  async dayDetail(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('date') date: string,
  ) {
    return this.sessionService.getDayDetail(memberId, date);
  }

  @Query(() => [CalendarDay], { description: '특정 멤버의 월간 캘린더' })
  @UseGuards(WorkspaceGuard)
  async calendar(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
  ) {
    return this.sessionService.getCalendar(memberId, year, month);
  }

  @Query(() => MonthlySummaryResult, { description: '특정 멤버의 월간 요약' })
  @UseGuards(WorkspaceGuard)
  async monthlySummary(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.sessionService.getMonthlySummary(memberId, year, month, workspaceId);
  }

  @Mutation(() => Session, { description: '체크인 (지각 자동 감지)' })
  @UseGuards(WorkspaceGuard)
  async checkIn(
    @Args('memberId', { type: () => ID }) memberId: string,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<SessionEntity> {
    return this.sessionService.checkIn(memberId, workspaceId);
  }

  @Mutation(() => Session, { description: '체크아웃' })
  @UseGuards(WorkspaceGuard)
  async checkOut(
    @Args('memberId', { type: () => ID }) memberId: string,
  ): Promise<SessionEntity> {
    return this.sessionService.checkOut(memberId);
  }

  @ResolveField(() => Int, {
    nullable: true,
    description: '학습 시간(분), 체크아웃 전이면 현재까지 경과 시간',
  })
  durationMinutes(@Parent() session: SessionEntity): number | null {
    if (!session.checkOutTime) return null;
    return calculateDurationMinutes(session.checkInTime, session.checkOutTime);
  }

  @ResolveField(() => String, { description: '체크인 시각 (ISO 8601)' })
  checkInTime(@Parent() session: SessionEntity): string {
    return session.checkInTime.toISOString();
  }

  @ResolveField(() => String, {
    nullable: true,
    description: '체크아웃 시각 (ISO 8601, 학습 중이면 null)',
  })
  checkOutTime(@Parent() session: SessionEntity): string | null {
    return session.checkOutTime?.toISOString() ?? null;
  }
}

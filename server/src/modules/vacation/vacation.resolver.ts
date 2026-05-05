import { Resolver, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DailyVacation } from './dto/daily-vacation.object';
import { UseVacationsResult } from './dto/use-vacations-result.object';
import { VacationService } from './vacation.service';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';

@Resolver(() => DailyVacation)
export class VacationResolver {
  constructor(private readonly vacationService: VacationService) {}

  @Mutation(() => DailyVacation, { description: '휴가 사용 등록' })
  @UseGuards(WorkspaceGuard)
  async useVacation(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('date') date: string,
    @Args('hours', { type: () => Int }) hours: number,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.vacationService.useVacation(memberId, workspaceId, date, hours);
  }

  @Mutation(() => UseVacationsResult, { description: '다중 날짜 휴가 일괄 등록' })
  @UseGuards(WorkspaceGuard)
  async useVacations(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('dates', { type: () => [String] }) dates: string[],
    @Args('hours', { type: () => Int }) hours: number,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.vacationService.useVacations(memberId, workspaceId, dates, hours);
  }

  @Mutation(() => Boolean, { description: '휴가 취소' })
  @UseGuards(WorkspaceGuard)
  async cancelVacation(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('date') date: string,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<boolean> {
    return this.vacationService.cancelVacation(memberId, workspaceId, date);
  }
}

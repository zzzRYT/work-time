import { Resolver, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { DailyVacation } from './dto/daily-vacation.object';
import { UseVacationsResult } from './dto/use-vacations-result.object';
import { VacationService } from './vacation.service';

@Resolver(() => DailyVacation)
export class VacationResolver {
  constructor(private readonly vacationService: VacationService) {}

  @Mutation(() => DailyVacation, { description: '휴가 사용 등록' })
  async useVacation(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('date') date: string,
    @Args('hours', { type: () => Int }) hours: number,
  ) {
    return this.vacationService.useVacation(memberId, date, hours);
  }

  @Mutation(() => UseVacationsResult, { description: '다중 날짜 휴가 일괄 등록' })
  async useVacations(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('dates', { type: () => [String] }) dates: string[],
    @Args('hours', { type: () => Int }) hours: number,
  ) {
    return this.vacationService.useVacations(memberId, dates, hours);
  }

  @Mutation(() => Boolean, { description: '휴가 취소' })
  async cancelVacation(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('date') date: string,
  ): Promise<boolean> {
    return this.vacationService.cancelVacation(memberId, date);
  }
}

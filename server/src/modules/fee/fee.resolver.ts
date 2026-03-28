import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { MonthlyFee } from './dto/monthly-fee.object';
import { FeeStatusEntry } from './dto/fee-status-entry.object';
import { RankingEntry } from './dto/ranking-entry.object';
import { FeeService } from './fee.service';
import { RankingPeriod } from './enums/ranking-period.enum';
import { FeeType } from './enums/fee-type.enum';

@Resolver(() => MonthlyFee)
export class FeeResolver {
  constructor(private readonly feeService: FeeService) {}

  @Query(() => [FeeStatusEntry], { description: '월별 회비 상태 조회' })
  async feeStatus(@Args('month') month: string) {
    return this.feeService.getFeeStatus(month);
  }

  @Query(() => [RankingEntry], { description: '멤버 랭킹 (주간/월간)' })
  async memberRanking(
    @Args('period', { type: () => RankingPeriod }) period: RankingPeriod,
  ) {
    return this.feeService.getMemberRanking(period);
  }

  @Mutation(() => MonthlyFee, {
    description: '멤버가 납부 완료 신청 (UNPAID → PENDING)',
  })
  async requestFeePayment(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('month') month: string,
    @Args('type', { type: () => FeeType }) type: FeeType,
  ) {
    return this.feeService.requestFeePayment(memberId, month, type);
  }

  @Mutation(() => MonthlyFee, {
    description: '어드민이 납부 확인 (PENDING → PAID)',
  })
  async confirmFeePayment(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('month') month: string,
    @Args('type', { type: () => FeeType }) type: FeeType,
  ) {
    return this.feeService.confirmFeePayment(memberId, month, type);
  }

  @Mutation(() => MonthlyFee, {
    description: '어드민이 납부 거절 (PENDING → UNPAID)',
  })
  async rejectFeePayment(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('month') month: string,
    @Args('type', { type: () => FeeType }) type: FeeType,
  ) {
    return this.feeService.rejectFeePayment(memberId, month, type);
  }
}

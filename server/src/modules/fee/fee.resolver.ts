import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MonthlyFee } from './dto/monthly-fee.object';
import { FeeStatusEntry } from './dto/fee-status-entry.object';
import { RankingEntry } from './dto/ranking-entry.object';
import { FeeService } from './fee.service';
import { RankingPeriod } from './enums/ranking-period.enum';
import { FeeType } from './enums/fee-type.enum';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';

@Resolver(() => MonthlyFee)
export class FeeResolver {
  constructor(private readonly feeService: FeeService) {}

  @Query(() => [FeeStatusEntry], { description: '월별 회비 상태 조회' })
  @UseGuards(WorkspaceGuard)
  async feeStatus(
    @Args('month') month: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.feeService.getFeeStatus(month, workspaceId);
  }

  @Query(() => [RankingEntry], { description: '멤버 랭킹 (주간/월간)' })
  @UseGuards(WorkspaceGuard)
  async memberRanking(
    @Args('period', { type: () => RankingPeriod }) period: RankingPeriod,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.feeService.getMemberRanking(period, workspaceId);
  }

  @Mutation(() => MonthlyFee, {
    description: '멤버가 납부 완료 신청 (UNPAID → PENDING)',
  })
  @UseGuards(WorkspaceGuard)
  async requestFeePayment(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('month') month: string,
    @Args('type', { type: () => FeeType }) type: FeeType,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.feeService.requestFeePayment(memberId, workspaceId, month, type);
  }

  @Mutation(() => MonthlyFee, {
    description: '어드민이 납부 확인 (PENDING → PAID)',
  })
  @UseGuards(AdminGuard)
  async confirmFeePayment(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('month') month: string,
    @Args('type', { type: () => FeeType }) type: FeeType,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.feeService.confirmFeePayment(memberId, workspaceId, month, type);
  }

  @Mutation(() => MonthlyFee, {
    description: '어드민이 납부 거절 (PENDING → UNPAID)',
  })
  @UseGuards(AdminGuard)
  async rejectFeePayment(
    @Args('memberId', { type: () => ID }) memberId: string,
    @Args('month') month: string,
    @Args('type', { type: () => FeeType }) type: FeeType,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.feeService.rejectFeePayment(memberId, workspaceId, month, type);
  }
}

import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType({ description: '월간 요약 통계' })
export class MonthlySummaryResult {
  @Field(() => Int, { description: '출석 일수' })
  attendanceDays!: number;

  @Field(() => Int, { description: '총 학습 시간(분)' })
  totalStudyMinutes!: number;

  @Field(() => Int, { description: '일 평균 학습 시간(분)' })
  averageDailyMinutes!: number;

  @Field(() => Int, { description: '지각 횟수' })
  lateCount!: number;

  @Field(() => Int, { description: '휴가 일수' })
  vacationDays!: number;

  @Field(() => Int, { description: '총 지각 벌금(원)' })
  totalLateFee!: number;
}

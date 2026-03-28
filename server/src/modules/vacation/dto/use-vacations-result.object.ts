import { ObjectType, Field } from '@nestjs/graphql';
import { DailyVacation } from './daily-vacation.object';
import { VacationFailure } from './vacation-failure.object';

@ObjectType({ description: '다중 날짜 휴가 등록 결과' })
export class UseVacationsResult {
  @Field(() => [DailyVacation], { description: '등록 성공한 휴가 목록' })
  succeeded!: DailyVacation[];

  @Field(() => [VacationFailure], { description: '등록 실패한 날짜와 사유' })
  failed!: VacationFailure[];
}

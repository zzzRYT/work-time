import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType({ description: '일일 휴가 기록' })
export class DailyVacation {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  memberId!: string;

  @Field({ description: '날짜 (YYYY-MM-DD)' })
  date!: string;

  @Field(() => Int, { description: '휴가 시간 (2, 4, 6, 8시간 단위)' })
  hours!: number;
}

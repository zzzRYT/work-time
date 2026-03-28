import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType({ description: '출석 세션 (체크인~체크아웃)' })
export class Session {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  memberId!: string;

  @Field({ description: '날짜 (YYYY-MM-DD)' })
  date!: string;

  @Field({ description: '체크인 시각 (ISO 8601)' })
  checkInTime!: string;

  @Field(() => String, { nullable: true, description: '체크아웃 시각 (ISO 8601, 학습 중이면 null)' })
  checkOutTime!: string | null;

  @Field({ description: '지각 여부' })
  isLate!: boolean;

  @Field(() => Int, { nullable: true, description: '학습 시간(분), 체크아웃 전이면 현재까지 경과 시간' })
  durationMinutes!: number | null;
}

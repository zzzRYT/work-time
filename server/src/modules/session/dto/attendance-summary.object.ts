import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType({ description: '출석 요약 통계' })
export class AttendanceSummary {
  @Field(() => Int, { description: '전체 멤버 수' })
  total!: number;

  @Field(() => Int, { description: '출석한 멤버 수' })
  attended!: number;

  @Field(() => Int, { description: '현재 학습 중인 멤버 수' })
  studying!: number;

  @Field(() => Int, { description: '지각한 멤버 수' })
  late!: number;
}

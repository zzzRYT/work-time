import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Member } from '../../member/dto/member.object';

@ObjectType({ description: '랭킹 항목' })
export class RankingEntry {
  @Field(() => Member)
  member!: Member;

  @Field(() => Int, { description: '총 학습 시간(분)' })
  totalStudyMinutes!: number;

  @Field(() => Int, { description: '출석 일수' })
  attendanceDays!: number;

  @Field(() => Int, { description: '지각 횟수' })
  lateCount!: number;
}

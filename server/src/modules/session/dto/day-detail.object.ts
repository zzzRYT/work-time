import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Session } from './session.object';

@ObjectType({ description: '특정 날짜의 상세 출석 정보' })
export class DayDetailResult {
  @Field(() => [Session])
  sessions!: Session[];

  @Field(() => Int, { description: '총 학습 시간(분)' })
  totalDurationMinutes!: number;

  @Field(() => Int, { nullable: true, description: '휴가 사용 시간' })
  vacationHours!: number | null;
}

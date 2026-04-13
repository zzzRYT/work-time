import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType({ description: '휴가 등록 실패 정보' })
export class VacationFailure {
  @Field()
  date!: string;

  @Field()
  reason!: string;
}

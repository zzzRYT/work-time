import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType({ description: '스터디 그룹 전역 설정' })
export class Settings {
  @Field(() => ID)
  id!: string;

  @Field(() => Int, { description: '출근 시간 (시, 0~23)' })
  studyStartHour!: number;

  @Field(() => Int, { description: '출근 시간 (분, 0~59)' })
  studyStartMinute!: number;

  @Field(() => Int, { description: '지각비 (원, 0 이상)' })
  lateFeeAmount!: number;

  @Field(() => Int, { description: '월회비 (원, 0 이상)' })
  monthlyFeeAmount!: number;

  @Field({ description: '마지막 수정 시각' })
  updatedAt!: string;
}

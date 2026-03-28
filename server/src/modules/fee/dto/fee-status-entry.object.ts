import { ObjectType, Field, Int } from '@nestjs/graphql';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Member } from '../../member/dto/member.object';

@ObjectType({ description: '회비 상태 항목' })
export class FeeStatusEntry {
  @Field(() => Member)
  member!: Member;

  @Field(() => Int, { description: '지각 벌금(원)' })
  lateFee!: number;

  @Field(() => Int, { description: '월 회비(원)' })
  monthlyFee!: number;

  @Field(() => PaymentStatus, { description: '월 회비 납부 상태' })
  monthlyFeeStatus!: PaymentStatus;

  @Field(() => PaymentStatus, { description: '지각비 납부 상태' })
  lateFeeStatus!: PaymentStatus;

  @Field(() => Int, { description: '지각 횟수' })
  lateCount!: number;
}

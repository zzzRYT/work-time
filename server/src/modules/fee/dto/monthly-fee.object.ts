import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PaymentStatus } from '../enums/payment-status.enum';

@ObjectType({ description: '월별 회비 납부 기록' })
export class MonthlyFee {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  memberId!: string;

  @Field({ description: '월 (YYYY-MM)' })
  month!: string;

  @Field(() => PaymentStatus, { description: '월 회비 납부 상태' })
  monthlyFeeStatus!: PaymentStatus;

  @Field(() => PaymentStatus, { description: '지각비 납부 상태' })
  lateFeeStatus!: PaymentStatus;
}

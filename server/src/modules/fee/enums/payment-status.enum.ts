import { registerEnumType } from '@nestjs/graphql';

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
}

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: '납부 상태',
  valuesMap: {
    UNPAID: { description: '미납' },
    PENDING: { description: '확인 대기' },
    PAID: { description: '납부 완료' },
  },
});

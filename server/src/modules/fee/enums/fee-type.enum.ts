import { registerEnumType } from '@nestjs/graphql';

export enum FeeType {
  MONTHLY = 'MONTHLY',
  LATE = 'LATE',
}

registerEnumType(FeeType, {
  name: 'FeeType',
  description: '납부 항목 종류',
  valuesMap: {
    MONTHLY: { description: '월 회비' },
    LATE: { description: '지각비' },
  },
});

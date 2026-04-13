import { registerEnumType } from '@nestjs/graphql';

export enum RankingPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

registerEnumType(RankingPeriod, {
  name: 'RankingPeriod',
  description: '랭킹 기간',
  valuesMap: {
    WEEKLY: { description: '주간' },
    MONTHLY: { description: '월간' },
  },
});

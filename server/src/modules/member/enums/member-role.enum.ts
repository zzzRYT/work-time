import { registerEnumType } from '@nestjs/graphql';

export enum MemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

registerEnumType(MemberRole, {
  name: 'MemberRole',
  description: '멤버 역할',
  valuesMap: {
    ADMIN: { description: '관리자' },
    MEMBER: { description: '일반 멤버' },
  },
});

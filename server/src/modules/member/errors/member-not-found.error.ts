import { GraphQLError } from 'graphql';

export class MemberNotFoundError extends GraphQLError {
  constructor() {
    super('멤버를 찾을 수 없습니다.', {
      extensions: { code: 'MEMBER_NOT_FOUND' },
    });
  }
}

import { GraphQLError } from 'graphql';

export class FullDayVacationError extends GraphQLError {
  constructor() {
    super('전일 휴가 중에는 체크인할 수 없습니다.', {
      extensions: { code: 'FULL_DAY_VACATION' },
    });
  }
}

export class AlreadyCheckedInError extends GraphQLError {
  constructor() {
    super('이미 체크인 상태입니다.', {
      extensions: { code: 'ALREADY_CHECKED_IN' },
    });
  }
}

export class NotCheckedInError extends GraphQLError {
  constructor() {
    super('체크인 상태가 아닙니다.', {
      extensions: { code: 'NOT_CHECKED_IN' },
    });
  }
}

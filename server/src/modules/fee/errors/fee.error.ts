import { GraphQLError } from 'graphql';

export class InvalidMonthFormatError extends GraphQLError {
  constructor() {
    super('월은 YYYY-MM 형식이어야 합니다.', {
      extensions: { code: 'INVALID_MONTH_FORMAT' },
    });
  }
}

export class InvalidStatusTransitionError extends GraphQLError {
  constructor(currentStatus: string, action: string) {
    const message =
      action === 'request'
        ? `현재 상태(${currentStatus})에서는 납부 신청할 수 없습니다.`
        : `확인 대기 상태가 아닙니다. 현재 상태: ${currentStatus}`;
    super(message, {
      extensions: { code: 'INVALID_STATUS_TRANSITION' },
    });
  }
}

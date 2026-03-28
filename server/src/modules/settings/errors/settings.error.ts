import { GraphQLError } from 'graphql';

export class InvalidRoleError extends GraphQLError {
  constructor() {
    super('role은 ADMIN 또는 MEMBER여야 합니다.', {
      extensions: { code: 'INVALID_ROLE' },
    });
  }
}

export class LastAdminError extends GraphQLError {
  constructor() {
    super('관리자가 최소 1명은 필요합니다.', {
      extensions: { code: 'LAST_ADMIN' },
    });
  }
}

export class InvalidHourError extends GraphQLError {
  constructor() {
    super('시간은 0~23 범위여야 합니다.', {
      extensions: { code: 'INVALID_HOUR' },
    });
  }
}

export class InvalidMinuteError extends GraphQLError {
  constructor() {
    super('분은 0~59 범위여야 합니다.', {
      extensions: { code: 'INVALID_MINUTE' },
    });
  }
}

export class InvalidAmountError extends GraphQLError {
  constructor() {
    super('금액은 0 이상이어야 합니다.', {
      extensions: { code: 'INVALID_AMOUNT' },
    });
  }
}

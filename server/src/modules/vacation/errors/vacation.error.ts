import { GraphQLError } from 'graphql';
import { VACATION_UNITS } from '../vacation.constants';

export class InvalidVacationHoursError extends GraphQLError {
  constructor() {
    super(`휴가는 ${VACATION_UNITS.join(', ')}시간 단위만 가능합니다.`, {
      extensions: { code: 'INVALID_VACATION_HOURS' },
    });
  }
}

export class VacationAlreadyExistsError extends GraphQLError {
  constructor() {
    super('이미 해당 날짜에 휴가가 등록되어 있습니다.', {
      extensions: { code: 'VACATION_ALREADY_EXISTS' },
    });
  }
}

export class ActiveSessionExistsError extends GraphQLError {
  constructor() {
    super('공부 중에는 전일 휴가를 사용할 수 없습니다. 먼저 체크아웃해주세요.', {
      extensions: { code: 'ACTIVE_SESSION_EXISTS' },
    });
  }
}

export class VacationNotFoundError extends GraphQLError {
  constructor() {
    super('해당 날짜에 등록된 휴가가 없습니다.', {
      extensions: { code: 'VACATION_NOT_FOUND' },
    });
  }
}

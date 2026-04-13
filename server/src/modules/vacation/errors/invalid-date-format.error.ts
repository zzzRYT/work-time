import { GraphQLError } from 'graphql';

export class InvalidDateFormatError extends GraphQLError {
  constructor() {
    super('날짜는 YYYY-MM-DD 형식이어야 합니다.', {
      extensions: { code: 'INVALID_DATE_FORMAT' },
    });
  }
}

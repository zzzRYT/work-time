import { AppException } from './app-exception.base';

export class UnauthorizedException extends AppException {
  readonly code = 'UNAUTHORIZED';
  readonly httpStatus = 401;
}

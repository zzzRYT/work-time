import { AppException } from './app-exception.base';

export class ForbiddenException extends AppException {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
}

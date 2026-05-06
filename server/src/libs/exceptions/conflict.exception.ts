import { AppException } from './app-exception.base';

export class ConflictException extends AppException {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;
}

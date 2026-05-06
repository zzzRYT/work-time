import { HttpStatus } from '@nestjs/common';
import { AppException } from './app-exception.base';

export class ForbiddenException extends AppException {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = HttpStatus.FORBIDDEN;
}

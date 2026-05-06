import { HttpStatus } from '@nestjs/common';
import { AppException } from './app-exception.base';

export class NotFoundException extends AppException {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor(resource: string, identifier?: string) {
    super(identifier ? `${resource} not found: ${identifier}` : `${resource} not found`);
  }
}

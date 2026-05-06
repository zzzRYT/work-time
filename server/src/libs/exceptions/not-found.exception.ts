import { AppException } from './app-exception.base';

export class NotFoundException extends AppException {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;

  constructor(resource: string, identifier?: string) {
    super(identifier ? `${resource} not found: ${identifier}` : `${resource} not found`);
  }
}

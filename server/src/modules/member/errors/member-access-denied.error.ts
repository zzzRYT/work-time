import { ForbiddenException } from '@nestjs/common';

export class MemberAccessDeniedError extends ForbiddenException {
  constructor() {
    super('Member does not belong to this workspace');
  }
}

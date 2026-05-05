import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { WorkspaceGuard } from './workspace.guard';

@Injectable()
export class AdminGuard extends WorkspaceGuard {
  constructor(authService: AuthService) {
    super(authService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    if (req.workspaceRole !== 'OWNER') {
      throw new ForbiddenException('Workspace owner role required');
    }

    return true;
  }
}

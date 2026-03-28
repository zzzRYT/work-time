import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Injectable()
export class WorkspaceGuard extends AuthGuard {
  constructor(authService: AuthService) {
    super(authService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID required');
    }

    const membership = await this.authService.getWorkspaceMembership(
      req.user.id,
      workspaceId,
    );

    if (!membership) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    req.workspaceId = workspaceId;
    req.workspaceRole = membership.role;

    return true;
  }
}

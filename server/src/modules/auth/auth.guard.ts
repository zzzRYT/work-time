import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(protected readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    const supabaseUser = await this.authService.validateSupabaseToken(token);
    req.user = await this.authService.getOrCreateUser(supabaseUser);

    return true;
  }
}

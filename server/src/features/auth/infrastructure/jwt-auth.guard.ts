import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AUTH_PORT, IAuthPort } from '../../../libs/auth/auth.port';
import { UnauthorizedException } from '../../../libs/exceptions/unauthorized.exception';
import { GraphQLContext } from '../../../libs/graphql/graphql-context.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_PORT) private readonly authPort: IAuthPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context).getContext<GraphQLContext>();
    const header = gqlCtx.req.headers.authorization;
    if (!header) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must use Bearer scheme');
    }

    gqlCtx.req.user = await this.authPort.verifyToken(token);
    return true;
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser } from '~/libs/auth/auth.port';
import { GraphQLContext } from '~/libs/graphql/graphql-context.type';
import { UnauthorizedException } from '~/libs/exceptions/unauthorized.exception';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const ctx = GqlExecutionContext.create(context).getContext<GraphQLContext>();
    const user = ctx.req.user;
    if (!user) {
      throw new UnauthorizedException(
        '@CurrentUser used on unguarded resolver — JwtAuthGuard must run first',
      );
    }
    return user;
  },
);

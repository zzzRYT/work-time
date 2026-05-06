import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser } from '~/libs/auth/auth.port';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    return GqlExecutionContext.create(context).getContext<{ req: { user: AuthUser } }>().req.user;
  },
);

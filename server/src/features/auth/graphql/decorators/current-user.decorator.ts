import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser } from '~/libs/auth/auth.port';
import { GraphQLContext } from '~/libs/graphql/graphql-context.type';
import { InternalException } from '~/libs/exceptions/internal.exception';

export function currentUserFactory(
  _data: unknown,
  context: ExecutionContext,
): AuthUser {
  const ctx = GqlExecutionContext.create(context).getContext<GraphQLContext>();
  const user = ctx.req.user;

  if (!user) {
    // 가드가 없는 리졸버에서 @CurrentUser가 사용된 서버 측 구성 오류.
    // GqlExceptionFilter가 클라이언트엔 INTERNAL_ERROR/500으로 sanitize하고,
    // 원본 메시지·스택은 서버 로그(Sentry)에만 남긴다.
    throw new InternalException(
      '@CurrentUser used on resolver without JwtAuthGuard — server misconfiguration',
    );
  }

  return user;
}

export const CurrentUser = createParamDecorator(currentUserFactory);

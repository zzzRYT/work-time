import { Catch, ArgumentsHost, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BaseException } from './base-exception.base';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GqlExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): GraphQLError {
    GqlArgumentsHost.create(host);
    return this.toGraphQLError(exception);
  }

  toGraphQLError(exception: unknown): GraphQLError {
    if (
      exception instanceof BaseException &&
      exception.httpStatus < HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          httpStatus: exception.httpStatus,
        },
      });
    }

    // 5xx BaseException 또는 알 수 없는 예외 — 원본은 로그로만, 클라이언트엔 일반 메시지
    this.logger.error(
      exception instanceof Error ? exception.stack ?? exception.message : exception,
    );

    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_ERROR',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  }
}

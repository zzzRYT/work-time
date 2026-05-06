import { Catch, ArgumentsHost, ExceptionFilter, Logger } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { AppException } from './app-exception.base';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GqlExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): GraphQLError {
    GqlArgumentsHost.create(host);
    return this.toGraphQLError(exception);
  }

  toGraphQLError(exception: unknown): GraphQLError {
    if (exception instanceof AppException) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          httpStatus: exception.httpStatus,
        },
      });
    }

    // Non-AppException은 예상 밖 서버 오류로 간주.
    // 원본 메시지/스택은 로그로만 남기고 클라이언트엔 일반 메시지만 노출.
    this.logger.error(
      exception instanceof Error ? exception.stack ?? exception.message : exception,
    );

    return new GraphQLError('Internal server error', {
      extensions: { code: 'INTERNAL_ERROR', httpStatus: 500 },
    });
  }
}

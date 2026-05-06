import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { AppException } from './app-exception.base';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
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
    const message = exception instanceof Error ? exception.message : 'Internal error';
    return new GraphQLError(message, {
      extensions: { code: 'INTERNAL_ERROR', httpStatus: 500 },
    });
  }
}

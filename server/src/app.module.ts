import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';
import mikroOrmConfig from './libs/orm/mikro-orm.config';
import { GqlExceptionFilter } from './libs/exceptions/gql-exception.filter';
import { AuthModule } from './features/auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      context: ({ req }: any) => ({ req }),
    }),
    ThrottlerModule.forRoot([{ ttl: 15 * 60 * 1000, limit: 1000 }]),
    CqrsModule.forRoot(),
    AuthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GqlExceptionFilter },
  ],
})
export class AppModule {}

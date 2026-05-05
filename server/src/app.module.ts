import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { MemberModule } from './modules/member/member.module';
import { SessionModule } from './modules/session/session.module';
import { VacationModule } from './modules/vacation/vacation.module';
import { FeeModule } from './modules/fee/fee.module';
import { SettingsModule } from './modules/settings/settings.module';
import {
  UserEntity,
  WorkspaceEntity,
  WorkspaceMemberEntity,
  InviteEntity,
  MemberEntity,
  SessionEntity,
  DailyVacationEntity,
  MonthlyFeeEntity,
  SettingsEntity,
} from './entities';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { InviteModule } from './modules/invite/invite.module';

function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 5432,
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace('/', ''),
  };
}

const dbConfig = process.env.DATABASE_URL
  ? parseDbUrl(process.env.DATABASE_URL)
  : {};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...dbConfig,
      entities: [
        UserEntity,
        WorkspaceEntity,
        WorkspaceMemberEntity,
        InviteEntity,
        MemberEntity,
        SessionEntity,
        DailyVacationEntity,
        MonthlyFeeEntity,
        SettingsEntity,
      ],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.NODE_ENV !== 'production',
      ssl: process.env.DATABASE_URL?.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
      extra: {
        // Supabase transaction pooler (port 6543) requires this
        pgbouncer: true,
        // Disable prepared statements for pgbouncer compatibility
        statement_timeout: 30000,
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1000,
        limit: 1000,
      },
    ]),
    HealthModule,
    AuthModule,
    WorkspaceModule,
    InviteModule,
    MemberModule,
    SessionModule,
    VacationModule,
    FeeModule,
    SettingsModule,
  ],
})
export class AppModule {}

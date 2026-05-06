import { Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { AUTH_PORT } from '~/libs/auth/auth.port';
import { SupabaseAuthAdapter } from './infrastructure/supabase-auth.adapter';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { AuthQueriesResolver } from './graphql/resolvers/auth.queries';

@Module({
  providers: [
    {
      provide: AUTH_PORT,
      useFactory: () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_ANON_KEY;
        if (!url || !key) {
          throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
        }
        const supabase = createClient(url, key);
        return new SupabaseAuthAdapter(supabase);
      },
    },
    JwtAuthGuard,
    AuthQueriesResolver,
  ],
  exports: [AUTH_PORT, JwtAuthGuard],
})
export class AuthModule {}

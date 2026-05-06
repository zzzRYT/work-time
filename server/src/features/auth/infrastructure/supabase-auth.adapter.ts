import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthUser, IAuthPort } from '~/libs/auth/auth.port';
import { UnauthorizedException } from '~/libs/exceptions/unauthorized.exception';

@Injectable()
export class SupabaseAuthAdapter implements IAuthPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async verifyToken(token: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid auth token');
    }
    const { id, email } = data.user;
    if (!email) {
      throw new UnauthorizedException('Auth user missing email');
    }
    return { id, email };
  }
}

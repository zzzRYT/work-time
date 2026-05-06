import { SupabaseAuthAdapter } from '../supabase-auth.adapter';
import { UnauthorizedException } from '~/libs/exceptions/unauthorized.exception';

describe('SupabaseAuthAdapter', () => {
  function makeAdapter(getUser: jest.Mock) {
    const supabase = { auth: { getUser } } as never;
    return new SupabaseAuthAdapter(supabase);
  }

  it('유효 토큰이면 AuthUser를 반환', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'u1', email: 'x@y.com' } },
      error: null,
    });
    const adapter = makeAdapter(getUser);

    const user = await adapter.verifyToken('valid-token');

    expect(user).toEqual({ id: 'u1', email: 'x@y.com' });
    expect(getUser).toHaveBeenCalledWith('valid-token');
  });

  it('Supabase가 error를 반환하면 UnauthorizedException', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });
    const adapter = makeAdapter(getUser);

    await expect(adapter.verifyToken('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Supabase가 user를 반환하지 않으면 UnauthorizedException', async () => {
    const getUser = jest.fn().mockResolvedValue({ data: { user: null }, error: null });
    const adapter = makeAdapter(getUser);

    await expect(adapter.verifyToken('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('user에 email이 없으면 UnauthorizedException', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'u1', email: null } },
      error: null,
    });
    const adapter = makeAdapter(getUser);

    await expect(adapter.verifyToken('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

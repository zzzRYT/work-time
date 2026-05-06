import type { Request } from 'express';
import type { AuthUser } from '../auth/auth.port';

export interface GraphQLContext {
  req: Request & { user?: AuthUser };
}

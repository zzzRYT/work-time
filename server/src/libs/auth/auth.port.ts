export interface AuthUser {
  id: string;
  email: string;
}

export const AUTH_PORT = Symbol('AUTH_PORT');

export interface IAuthPort {
  verifyToken(token: string): Promise<AuthUser>;
}

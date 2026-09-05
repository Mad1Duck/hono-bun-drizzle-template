import { jwt } from 'hono/jwt';

export const createAuthentication = (secret: string) =>
  jwt({ secret, alg: 'HS256' });

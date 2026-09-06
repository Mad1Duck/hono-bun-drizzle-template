import { env } from '@/config/env';
import { decode, sign, verify, jwt } from 'hono/jwt';

interface tokenParams {
  email: string;
  national_id?: string;
  id: string;
  roles: string;
  isPlatformOwner?: boolean | null;
}

const getAccessTtlSeconds = () => env.ACCESS_TOKEN_TTL_SECONDS;

export const generateToken = async ({ email, id, roles, isPlatformOwner }: tokenParams) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    id,
    email,
    roles,
    isPlatformOwner,
    type: 'access',
    iat: now,
    exp: now + getAccessTtlSeconds(),
  };
  const secret = env.JWT_SECRET;
  const token = await sign(payload, secret, 'HS256');

  return token;
};

export const generateRefreshToken = async ({ email, national_id, id, roles, isPlatformOwner }: tokenParams) => {
  const refreshTtlDays = env.REFRESH_TOKEN_TTL_DAYS;
  const now = Math.floor(Date.now() / 1000);
  const tmpExp = now + 60 * 60 * 24 * refreshTtlDays;
  const payload = {
    id,
    email,
    national_id,
    roles,
    isPlatformOwner,
    type: 'refresh',
    iat: now,
    exp: tmpExp
  };
  const secret = env.JWT_SECRET;
  const token = await sign(payload, secret, 'HS256');

  return { token, tmpExp };
};

export const verifyToken = async (token: string) => {
  const secret = env.JWT_SECRET;
  const result = await verify(token, secret, 'HS256');

  return result;
};

export const decodeToken = async (token: string) => {
  const result = await decode(token);

  return result;
};

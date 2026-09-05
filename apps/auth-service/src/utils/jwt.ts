import { decode, sign, verify, jwt } from 'hono/jwt';

interface tokenParams {
  email: string;
  national_id?: string;
  id: string;
  roles: string;
  isPlatformOwner?: boolean | null;
}

const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
const DEFAULT_REFRESH_TTL_DAYS = 7;

const getAccessTtlSeconds = () => {
  const envValue = process.env.ACCESS_TOKEN_TTL_SECONDS;
  return envValue ? Number(envValue) : DEFAULT_ACCESS_TTL_SECONDS;
};

export const generateToken = async ({ email, id, roles, isPlatformOwner }: tokenParams) => {
  const payload = {
    id,
    email,
    roles,
    isPlatformOwner,
    type: 'access',
    exp: Math.floor(Date.now() / 1000) + getAccessTtlSeconds(),
  };
  const secret = process.env.JWT_SECRET || 'default';
  const token = await sign(payload, secret, 'HS256');

  return token;
};

export const generateRefreshToken = async ({ email, national_id, id, roles, isPlatformOwner }: tokenParams) => {
  const refreshTtlDays = process.env.REFRESH_TOKEN_TTL_DAYS
    ? Number(process.env.REFRESH_TOKEN_TTL_DAYS)
    : DEFAULT_REFRESH_TTL_DAYS;
  const tmpExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * refreshTtlDays;
  const payload = {
    id,
    email,
    national_id,
    roles,
    isPlatformOwner,
    type: 'refresh',
    exp: tmpExp
  };
  const secret = process.env.JWT_SECRET || 'default';
  const token = await sign(payload, secret, 'HS256');

  return { token, tmpExp };
};

export const verifyToken = async (token: string) => {
  const secret = process.env.JWT_SECRET || 'default';
  const result = await verify(token, secret, 'HS256');

  return result;
};

export const decodeToken = async (token: string) => {
  const result = await decode(token);

  return result;
};

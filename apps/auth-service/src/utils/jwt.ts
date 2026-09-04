import { decode, sign, verify, jwt } from 'hono/jwt';

interface tokenParams {
  email: string;
  national_id?: string;
  id: string;
  roles: string;
}

export const generateToken = async ({ email, id, roles }: tokenParams) => {
  const payload = {
    id,
    email,
    type: 'access',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };
  const secret = process.env.JWT_SECRET || 'default';
  const token = await sign(payload, secret, 'HS256');

  return token;
};

export const generateRefreshToken = async ({ email, national_id, id, roles }: tokenParams) => {
  const tmpExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payload = {
    id,
    email,
    national_id,
    roles,
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

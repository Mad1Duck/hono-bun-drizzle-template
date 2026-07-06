import { decode, sign, verify, jwt } from 'hono/jwt';

interface tokenParams {
  email: string;
  national_id?: string;
  id: string;
  roles: string;
}

// Generate Access Token (1 hari)
export const generateToken = async ({ email, id, roles }: tokenParams) => {
  const payload = {
    id,
    email,
    type: 'access', // tandai token ini access token
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 hari
  };
  const secret = process.env.JWT_SECRET || 'default';
  const token = await sign(payload, secret, 'HS256');

  return token;
};

// Generate Refresh Token (7 hari)
export const generateRefreshToken = async ({ email, national_id, id }: tokenParams) => {
  const tmpExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payload = {
    id,
    email,
    national_id,
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

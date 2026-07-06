import { decode } from 'hono/jwt';

export const decodeToken = async (token: string) => {
  try {
    return await decode(token);
  } catch {
    return null;
  }
};

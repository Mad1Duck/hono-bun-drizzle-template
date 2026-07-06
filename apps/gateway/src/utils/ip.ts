import { Context } from 'hono';

export const getClientIp = (c: Context): string => {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return c.req.header('x-real-ip') || 'unknown';
};

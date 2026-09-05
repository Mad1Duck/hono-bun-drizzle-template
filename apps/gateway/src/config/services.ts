import { env } from './env';

export const services = {
  AUTH_SERVICE: env.AUTH_SERVICE_URL,
  NOTIFICATION_SERVICE: env.NOTIFICATION_SERVICE_URL,
  USER_SERVICE: env.USER_SERVICE_URL,
};

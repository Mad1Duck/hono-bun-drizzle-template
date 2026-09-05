import { getServiceUrl } from '@repo/shared';
import { env } from './env';

const suffix = env.SERVICE_DISCOVERY_SUFFIX || '';

export const services = {
  AUTH_SERVICE: env.AUTH_SERVICE_URL || getServiceUrl('auth-service', 3001, suffix),
  NOTIFICATION_SERVICE: env.NOTIFICATION_SERVICE_URL || getServiceUrl('notification-service', 3004, suffix),
  USER_SERVICE: env.USER_SERVICE_URL || getServiceUrl('user-service', 3002, suffix),
  STORAGE_SERVICE: env.STORAGE_SERVICE_URL || getServiceUrl('storage-service', 3003, suffix),
  RBAC_SERVICE: env.RBAC_SERVICE_URL || getServiceUrl('rbac-service', 3005, suffix),
};

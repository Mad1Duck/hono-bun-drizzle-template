import { createProxy } from '../lib/proxy';
import { services } from '../config/services';

export const notificationProxy = createProxy(services.NOTIFICATION_SERVICE);

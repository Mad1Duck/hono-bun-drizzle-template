import { createProxy } from '../lib/proxy';
import { services } from '../config/services';

export const authProxy = createProxy(services.AUTH_SERVICE);

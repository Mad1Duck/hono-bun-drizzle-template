import { createProxy } from '../lib/proxy';
import { services } from '../config/services';

export const userProxy = createProxy(services.USER_SERVICE);

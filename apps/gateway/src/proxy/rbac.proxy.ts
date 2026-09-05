import { createProxy } from '../lib/proxy';
import { services } from '../config/services';

export const rbacProxy = createProxy(services.RBAC_SERVICE);

import { createProxy } from '../lib/proxy';
import { services } from '../config/services';

export const storageProxy = createProxy(services.STORAGE_SERVICE);

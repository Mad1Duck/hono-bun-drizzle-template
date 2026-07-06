import { timeout } from 'hono/timeout';
import { DEFAULT_TIMEOUT_MS } from '../config/constants';

export const requestTimeout = timeout(DEFAULT_TIMEOUT_MS);

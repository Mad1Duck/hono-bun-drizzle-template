import { createAuthentication } from '@repo/shared';
import { env } from '../config/env';

// Gatekeeper JWT di edge, sebelum request diteruskan ke service. Downstream service
// tetap boleh (dan sebaiknya) verifikasi ulang
export const authentication = createAuthentication(env.JWT_SECRET);

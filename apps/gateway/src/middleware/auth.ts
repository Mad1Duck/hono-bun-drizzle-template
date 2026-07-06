import { jwt } from 'hono/jwt';
import { env } from '../config/env';

// Gatekeeper JWT di edge, sebelum request diteruskan ke service. Downstream service
// tetap boleh (dan sebaiknya) verifikasi ulang
export const authentication = jwt({ secret: env.JWT_SECRET, alg: 'HS256' });

import { Hono } from 'hono';
import { createAuthentication } from '@repo/shared';
import { validate } from '@repo/validation';
import { updateUserSchema } from '../validator/user.validator';
import { getUser, getMe, patchUser, patchMe } from '../controller/user.controller';
import { env } from '@/config/env';

const authentication = createAuthentication(env.JWT_SECRET);

const app = new Hono()
  .get('/me', authentication, getMe)
  .patch('/me', authentication, validate(updateUserSchema), patchMe)
  .get('/:id', getUser)
  .patch('/:id', validate(updateUserSchema), patchUser);

export default app;

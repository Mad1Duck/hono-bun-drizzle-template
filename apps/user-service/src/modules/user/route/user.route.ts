import { Hono } from 'hono';
import { validate } from '@repo/validation';
import { updateUserSchema } from '../validator/user.validator';
import { getUser, patchUser } from '../controller/user.controller';

const app = new Hono()
  .get('/:id', getUser)
  .patch('/:id', validate(updateUserSchema), patchUser);

export default app;

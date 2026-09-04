import { Hono } from 'hono';
import { validate } from '@repo/validation';
import { loginSchema, refreshTokenSchema, registerSchema } from '../validator/auth.validator';
import { login, logout, refreshToken, register } from '../controller/auth.controller';

const app = new Hono()
    .post('/login', validate(loginSchema), login)
    .post('/register', validate(registerSchema), register)
    .post('/refresh', validate(refreshTokenSchema), refreshToken)
    .post('/logout', validate(refreshTokenSchema), logout);

export default app;

import { NotFoundHandler } from 'hono';
import { failureFromCode } from '../lib/response';

export const notFound: NotFoundHandler = (c) => failureFromCode(c, 'NOT_FOUND');

import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

export const bcryptHash = async (password: string) => bcrypt.hash(password, 4);

export const bcryptVerify = async (password: string, hashedPassword: string) => bcrypt.compare(password, hashedPassword);

export const sha256Hash = (value: string) => createHash('sha256').update(value).digest('hex');

import { createHash } from 'crypto';

export const bcryptHash = async (password: string) => await Bun.password.hash(password, {
  algorithm: "bcrypt",
  cost: 4,
});

export const bcryptVerify = async (password: string, hashedPassword: string) => await Bun.password.verify(password, hashedPassword, "bcrypt");

// Hash deterministik untuk token (refresh token, dsb) supaya nilai mentahnya tidak pernah disimpan di DB
export const sha256Hash = (value: string) => createHash('sha256').update(value).digest('hex');
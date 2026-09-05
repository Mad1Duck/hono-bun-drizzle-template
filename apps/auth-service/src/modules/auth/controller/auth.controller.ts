import { createUser, getUser, saveRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../service/auth.service";
import { catchAsync, success, ApiError } from "@repo/shared";
import { loginSchemaType, registerSchemaType, refreshTokenSchemaType } from "../validator/auth.validator";
import { bcryptHash, bcryptVerify } from "@/utils/hashing";
import { checkRateLimit, resetRateLimit } from "@repo/shared";
import { loginRateLimitConfig } from "@repo/config";
import { generateToken, generateRefreshToken, verifyToken } from "@/utils/jwt";
import * as HttpStatus from "http-status";

const dummyPasswordHash = bcryptHash("dummy-password-for-timing-safety");

export const register = catchAsync(async (c) => {
  const { email, firstName, lastName, password, phone, username } = c.get('parsedData') as registerSchemaType;

  const result = await createUser({
    email,
    firstName,
    lastName,
    password,
    phone,
    username,
  });

  return success(c, result, { code: HttpStatus.default.CREATED, message: "User registered successfully" });
});

export const login = catchAsync(async (c) => {
  const { password, username } = c.get('parsedData') as loginSchemaType;

  const rateLimitKey = `login:${username.toLowerCase()}`;
  const { allowed } = await checkRateLimit({
    key: rateLimitKey,
    limit: loginRateLimitConfig.maxAttempts,
    windowSeconds: loginRateLimitConfig.windowSeconds,
  });

  if (!allowed) {
    throw new ApiError('TOO_MANY_ATTEMPTS');
  }

  const findUser = await getUser({ identifier: username });

  if (!findUser) {
    await bcryptVerify(password, await dummyPasswordHash);
    throw new ApiError('INVALID_CREDENTIALS');
  }

  const verifiedPassword = await bcryptVerify(password, findUser.passwordHash);
  if (!verifiedPassword) {
    throw new ApiError('INVALID_CREDENTIALS');
  }

  await resetRateLimit(rateLimitKey);

  const payload = {
    id: findUser.id,
    email: findUser.email,
    roles: findUser.roles || "",
    isPlatformOwner: findUser.isPlatformOwner,
  };

  const accessToken = await generateToken(payload);
  const { token, tmpExp } = await generateRefreshToken(payload);

  await saveRefreshToken(findUser.id, token, new Date(tmpExp * 1000));

  return success(c, {
    firstName: findUser.firstName,
    lastName: findUser.lastName,
    email: findUser.email,
    roles: payload.roles,
    authorization: {
      token: accessToken,
      refreshToken: token,
    },
  }, { message: "Login successful" });
});

export const refreshToken = catchAsync(async (c) => {
  const { refreshToken } = c.get('parsedData') as refreshTokenSchemaType;

  if (!refreshToken) {
    throw new ApiError('REFRESH_TOKEN_REQUIRED');
  }

  const decoded = await verifyToken(refreshToken);
  if (!decoded) {
    throw new ApiError('INVALID_REFRESH_TOKEN');
  }

  const payload = {
    id: decoded.id as string,
    email: decoded.email as string,
    roles: decoded.roles as string,
    isPlatformOwner: (decoded.isPlatformOwner as boolean) ?? false,
  };

  const newAccessToken = await generateToken(payload);
  const { token: newRefreshToken, tmpExp } = await generateRefreshToken(payload);

  const rotated = await rotateRefreshToken({
    oldToken: refreshToken,
    userId: payload.id,
    newToken: newRefreshToken,
    expiresAt: new Date(tmpExp * 1000),
  });

  if (!rotated) {
    throw new ApiError('REFRESH_TOKEN_REVOKED');
  }

  return success(c, {
    token: newAccessToken,
    refreshToken: newRefreshToken,
  }, { message: "Token refreshed successfully" });
});

export const logout = catchAsync(async (c) => {
  const { refreshToken } = c.get('parsedData') as refreshTokenSchemaType;

  if (!refreshToken) {
    throw new ApiError('REFRESH_TOKEN_REQUIRED');
  }

  const decoded = await verifyToken(refreshToken);
  if (!decoded) {
    throw new ApiError('INVALID_REFRESH_TOKEN');
  }

  await revokeRefreshToken(refreshToken);

  return success(c, null, { message: "Logout successful" });
});

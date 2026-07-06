import { createUser, getUser, saveRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../service/auth.service";
import { catchAsync } from "@/utils/catchAsync";
import { success } from "@/utils/apiResponse";
import { loginSchemaType, registerSchemaType, refreshTokenSchemaType } from "../validator/auth.validator";
import { bcryptHash, bcryptVerify } from "@/utils/hashing";
import { checkRateLimit, resetRateLimit } from "@/utils/rateLimiter";
import { loginRateLimitConfig } from "@/bin/config";
import ApiError from "@/utils/ApiError";
import { generateToken, generateRefreshToken, verifyToken } from "@/utils/jwt";
import * as HttpStatus from "http-status";

const dummyPasswordHash = bcryptHash("dummy-password-for-timing-safety");

export const register = catchAsync(async (c) => {
  const { email, firstName, lastName, password, phone, username }: registerSchemaType = await c.req.parseBody();

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
  const { password, username }: loginSchemaType = await c.req.parseBody();

  const rateLimitKey = `login:${username.toLowerCase()}`;
  const { allowed } = await checkRateLimit({
    key: rateLimitKey,
    limit: loginRateLimitConfig.maxAttempts,
    windowSeconds: loginRateLimitConfig.windowSeconds,
  });

  if (!allowed) {
    throw new ApiError('TOO_MANY_ATTEMPTS');
  }

  const findUser = await getUser({ email: username, phone: username });

  if (!findUser) {
    await bcryptVerify(password, await dummyPasswordHash);
    throw new ApiError('INVALID_CREDENTIALS');
  }

  const verifiedPassword = await bcryptVerify(password, findUser.password);
  if (!verifiedPassword) {
    throw new ApiError('INVALID_CREDENTIALS');
  }

  await resetRateLimit(rateLimitKey);

  const payload = {
    id: findUser.id,
    email: findUser.email,
    roles: findUser.roles || ""
  };

  const accessToken = await generateToken(payload);
  const { token, tmpExp } = await generateRefreshToken(payload);

  await saveRefreshToken(findUser.id, token, new Date(tmpExp));

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
  const { refreshToken }: refreshTokenSchemaType = await c.req.parseBody();

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
  };

  const newAccessToken = await generateToken(payload);
  const { token: newRefreshToken, tmpExp } = await generateRefreshToken(payload);

  const rotated = await rotateRefreshToken({
    oldToken: refreshToken,
    userId: payload.id,
    newToken: newRefreshToken,
    expiresAt: new Date(tmpExp),
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
  const { refreshToken }: refreshTokenSchemaType = await c.req.parseBody();

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

import { createAuthentication, catchAsync, ApiError } from "@repo/shared";
import { env } from '@/config/env';
import { getUserById } from "@/modules/auth/service/auth.service";

export const authentication = createAuthentication(env.JWT_SECRET);

export const authenticationStoreOwner = catchAsync(async (c, next) => {
  const { id } = c.get("jwtPayload") as { id: string; };
  const findUser = await getUserById(id);

  if (findUser && findUser.roles === "Owner") {
    return await next();
  } else {
    throw new ApiError('FORBIDDEN');
  }
});

export const authenticationUser = catchAsync(async (c, next) => {
  const { id } = c.get("jwtPayload") as { id: string; };
  const findUser = await getUserById(id);

  if (findUser && findUser.roles === "USER") {
    return await next();
  } else {
    throw new ApiError('FORBIDDEN');
  }
});

export const authenticationAdministrator = catchAsync(async (c, next) => {
  const { id } = c.get("jwtPayload") as { id: string; };
  const findUser = await getUserById(id);

  if (findUser && findUser.roles === "Admin") {
    return await next();
  } else {
    throw new ApiError('FORBIDDEN');
  }
});

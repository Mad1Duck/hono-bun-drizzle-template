import { jwt } from "hono/jwt";
import { catchAsync, ApiError } from "@repo/shared";
import { getUserById } from "@/modules/auth/service/auth.service";

export const authentication = jwt({ secret: process.env.JWT_SECRET || 'default', alg: 'HS256' });

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

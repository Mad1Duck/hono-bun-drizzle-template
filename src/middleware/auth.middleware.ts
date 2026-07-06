import { jwt } from "hono/jwt";
import { catchAsync } from "@/utils/catchAsync";
import { getUserById } from "@/modules/auth/service/auth.service";
import ApiError from "@/utils/ApiError";
import * as _ from 'lodash';

export const authentication = jwt({ secret: process.env.JWT_SECRET || 'default', alg: 'HS256' });

export const authenticationStoreOwner = catchAsync(async (c, next) => {
  const { id } = c.get("jwtPayload") as { id: string; };
  return await next();
});

export const authenticationUser = catchAsync(async (c, next) => {
  const { id } = c.get("jwtPayload") as { id: string; };
  const findUser = await getUserById(id);

  if (findUser && _.find(findUser.roles, (item) => item === "Admin")) {
    return await next();
  } else {
    throw new ApiError('FORBIDDEN');
  }
});

export const authenticationAdministrator = catchAsync(async (c, next) => {
  const { id } = c.get("jwtPayload") as { id: string; };
  const findUser = await getUserById(id);

  if (findUser && _.find(findUser.roles, (item) => item === "Owner")) {
    return await next();
  } else {
    throw new ApiError('FORBIDDEN');
  }
});

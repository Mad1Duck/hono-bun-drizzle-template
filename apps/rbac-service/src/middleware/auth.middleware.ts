import { createAuthentication, catchAsync, ApiError } from "@repo/shared";
import { env } from '@/config/env';

export const authentication = createAuthentication(env.JWT_SECRET);

export const authenticationAdministrator = catchAsync(async (c, next) => {
  const { isPlatformOwner, roles } = c.get("jwtPayload") as {
    id: string;
    isPlatformOwner?: boolean;
    roles?: string;
  };

  const allowed = isPlatformOwner || roles === 'Owner' || roles === 'Admin';
  if (!allowed) {
    throw new ApiError('FORBIDDEN');
  }

  return await next();
});

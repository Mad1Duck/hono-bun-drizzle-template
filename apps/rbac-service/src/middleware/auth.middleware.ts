import { createAuthentication, catchAsync, ApiError } from "@repo/shared";

export const authentication = createAuthentication(process.env.JWT_SECRET || 'default');

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

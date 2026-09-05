import { success, catchAsync } from '@repo/shared';
import { getUserById, updateUser } from '../service/user.service';

export const getUser = catchAsync(async (c) => {
  const id = c.req.param('id')!;
  const user = await getUserById(id);
  return success(c, user);
});

export const getMe = catchAsync(async (c) => {
  const { id } = c.get('jwtPayload') as { id: string };
  const user = await getUserById(id);
  return success(c, user);
});

export const patchUser = catchAsync(async (c) => {
  const id = c.req.param('id')!;
  const body = c.get('parsedData');
  const user = await updateUser(id, body);
  return success(c, user);
});

export const patchMe = catchAsync(async (c) => {
  const { id } = c.get('jwtPayload') as { id: string };
  const body = c.get('parsedData');
  const user = await updateUser(id, body);
  return success(c, user);
});

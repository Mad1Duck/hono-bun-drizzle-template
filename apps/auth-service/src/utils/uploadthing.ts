import { env } from '@/config/env';
import { UTApi } from "uploadthing/server";

export const utapi = new UTApi({
  token: env.UPLOADTHING_SECRET
});

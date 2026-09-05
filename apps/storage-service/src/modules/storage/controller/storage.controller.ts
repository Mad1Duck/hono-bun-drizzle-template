import { catchAsync, success, failureFromCode } from "@repo/shared";
import { join } from "path";
import { writeFile } from "fs/promises";
import { utapi } from "@/utils/uploadthing";
import { toWebp } from "../service/image.service";
import { fileUtils } from "@/utils/fileUtils";

export const upload = catchAsync(async (c) => {
  const { file }: any = await c.req.parseBody();
  const publicPath = join(process.cwd(), 'public');

  if (file instanceof File) {
    const buffer = await file?.arrayBuffer();
    const { convertedBuffer, ext } = await toWebp({ file: buffer });
    const { originalName } = fileUtils(file);

    const newFilename = `${originalName}.${ext}`;
    const filepath = join(publicPath, newFilename);

    await writeFile(filepath, Buffer.from(convertedBuffer));

    return success(c, { filepath, file: originalName }, { message: "File uploaded successfully" });
  }

  return failureFromCode(c, 'UNSUPPORTED_MEDIA_TYPE');
});

export const uploadThing = catchAsync(async (c) => {
  const { file }: any = await c.req.parseBody();

  if (file instanceof File) {
    const buffer = await file?.arrayBuffer();

    const { convertedBuffer, mime, ext } = await toWebp({ file: buffer });
    const { originalName } = fileUtils(file);
    const newFilename = `${originalName}.${ext}`;

    const fileWithNewName = new File([convertedBuffer as unknown as BlobPart], newFilename, {
      type: mime,
    });

    const response = await utapi.uploadFiles([fileWithNewName]);

    return success(c, response, { message: "File uploaded successfully" });
  }

  return failureFromCode(c, 'UNSUPPORTED_MEDIA_TYPE');
});

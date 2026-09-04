import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

export const toWebp = async ({ file }: { file: ArrayBuffer; }) => {
  const buffer = Buffer.from(file);
  const type = await fileTypeFromBuffer(buffer);

  if (!type || !type.mime.startsWith('image/')) {
    return { convertedBuffer: buffer, mime: type?.mime ?? 'application/octet-stream', ext: type?.ext ?? 'bin' };
  }

  const convertedBuffer = await sharp(buffer)
    .webp()
    .toBuffer();

  return { convertedBuffer, mime: 'image/webp', ext: 'webp' };
};

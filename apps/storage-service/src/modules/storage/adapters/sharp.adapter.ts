import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import type { ImageConverterPort } from '../ports/storage.port';

export const sharpImageConverter: ImageConverterPort = {
  async convert(file) {
    const buffer = Buffer.from(file);
    const type = await fileTypeFromBuffer(buffer);

    if (!type || !type.mime.startsWith('image/')) {
      return {
        convertedBuffer: buffer,
        mime: type?.mime ?? 'application/octet-stream',
        ext: type?.ext ?? 'bin',
      };
    }

    const convertedBuffer = await sharp(buffer).webp().toBuffer();
    return { convertedBuffer, mime: 'image/webp', ext: 'webp' };
  },
};

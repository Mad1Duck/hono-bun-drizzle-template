import { sharpImageConverter } from '../adapters/sharp.adapter';

export const toWebp = async ({ file }: { file: ArrayBuffer }) => {
  return sharpImageConverter.convert(file);
};

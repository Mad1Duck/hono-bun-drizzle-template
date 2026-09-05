export interface ImageConverterPort {
  convert(file: ArrayBuffer): Promise<{
    convertedBuffer: Buffer;
    mime: string;
    ext: string;
  }>;
}

export interface FileUploaderPort {
  upload(file: { name: string; buffer: Buffer; mime: string }): Promise<string>;
}

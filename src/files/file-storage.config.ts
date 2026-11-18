import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { basename, extname } from 'path';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function isAllowedImageMimeType(mimetype: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimetype);
}

export function buildFilename(originalname: string): string {
  const extension = extname(originalname);
  const name = basename(originalname, extension)
    .replace(/\s+/g, '-')
    .toLowerCase();

  return `${Date.now()}-${name}${extension.toLowerCase()}`;
}

type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

export function fileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void {
  if (!isAllowedImageMimeType(file.mimetype)) {
    callback(
      new BadRequestException(
        'Разрешены только изображения формата jpeg, png, webp',
      ),
      false,
    );

    return;
  }

  callback(null, true);
}

export const fileStorageOptions = {
  storage: diskStorage({
    destination: './public/uploads',
    filename: (
      _request: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      callback(null, buildFilename(file.originalname));
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
};

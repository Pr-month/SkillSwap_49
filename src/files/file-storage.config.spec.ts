import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import {
  buildFilename,
  fileFilter,
  isAllowedImageMimeType,
} from './file-storage.config';

describe('file-storage.config', () => {
  describe('isAllowedImageMimeType', () => {
    it.each(['image/jpeg', 'image/png', 'image/webp'])(
      'accepts %s',
      (mimeType) => {
        expect(isAllowedImageMimeType(mimeType)).toBe(true);
      },
    );

    it.each(['image/gif', 'text/plain', 'application/pdf'])(
      'rejects %s',
      (mimeType) => {
        expect(isAllowedImageMimeType(mimeType)).toBe(false);
      },
    );
  });

  describe('buildFilename', () => {
    it('lowercases the name and replaces spaces with dashes', () => {
      const result = buildFilename('My Cool Photo.PNG');

      expect(result).toMatch(/^\d+-my-cool-photo\.png$/);
    });

    it('preserves the file extension', () => {
      const result = buildFilename('avatar.jpg');

      expect(result).toMatch(/^\d+-avatar\.jpg$/);
    });

    it('produces unique names because of the timestamp prefix', () => {
      const spy = jest.spyOn(Date, 'now');
      spy.mockReturnValueOnce(1000).mockReturnValueOnce(2000);

      expect(buildFilename('a.png')).toBe('1000-a.png');
      expect(buildFilename('a.png')).toBe('2000-a.png');

      spy.mockRestore();
    });
  });

  describe('fileFilter', () => {
    const request = {} as Request;
    const callback = jest.fn();

    beforeEach(() => {
      callback.mockClear();
    });

    it('accepts allowed mime types', () => {
      const file = { mimetype: 'image/png' } as Express.Multer.File;

      fileFilter(request, file, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('rejects disallowed mime types with a BadRequestException', () => {
      const file = { mimetype: 'text/plain' } as Express.Multer.File;

      fileFilter(request, file, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.any(BadRequestException),
        false,
      );
    });
  });
});

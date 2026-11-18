import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { basename, extname } from 'path';

type FileNameCallback = (error: Error | null, filename: string) => void;

@ApiTags('files')
@Controller('files')
export class FilesController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (
          _request: Request,
          file: Express.Multer.File,
          callback: FileNameCallback,
        ) => {
          const extension = extname(file.originalname).toLowerCase();

          const name = basename(file.originalname, extension)
            .replace(/\s+/g, '-')
            .toLowerCase();

          const filename = `${Date.now()}-${name}${extension}`;

          callback(null, filename);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (
        _request: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Разрешены только изображения формата jpeg, png, webp',
            ),
            false,
          );

          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Загрузить изображение' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Изображение (jpeg, png, webp; до 2 МБ)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Файл загружен',
  })
  @ApiResponse({ status: 400, description: 'Неподдерживаемый формат' })
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
    };
  }
}

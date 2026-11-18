import {
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
import { fileStorageOptions } from './file-storage.config';

@ApiTags('files')
@Controller('files')
export class FilesController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', fileStorageOptions))
  @ApiOperation({ summary: 'Загрузить изображение' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Изображение (jpeg, png, webp; до 2 МБ)',
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

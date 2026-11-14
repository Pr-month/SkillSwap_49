import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileStorageOptions } from './file-storage.config';

@Controller('files')
export class FilesController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', fileStorageOptions))
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
    };
  }
}

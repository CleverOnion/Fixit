import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

// 定义 Multer 文件类型
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  stream?: import('stream').Readable;
}

@Controller('files')
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async upload(
    @UploadedFile() file: MulterFile,
    @Request() req: any,
  ) {
    const result = await this.fileService.uploadImage(file, req.user.sub);
    return result;
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('key') key: string) {
    await this.fileService.deleteFile(key);
    return { success: true };
  }
}

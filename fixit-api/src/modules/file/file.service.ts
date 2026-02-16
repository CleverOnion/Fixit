import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma.service';

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

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(private prisma: PrismaService) {
    this.endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    this.bucket = process.env.MINIO_BUCKET || 'fixit-files';

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'password123',
      },
      forcePathStyle: true,
    });
  }

  async uploadImage(
    file: MulterFile,
    userId: string,
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('只支持 JPG、PNG、GIF、WebP 格式的图片');
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }

    // 生成唯一文件名
    const ext = this.getFileExtension(file.originalname);
    const key = `questions/${userId}/${uuidv4()}${ext}`;

    // 上传到 MinIO
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // 返回公开访问 URL
    const url = `${this.endpoint}/${this.bucket}/${key}`;

    return { url, key };
  }

  async getSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return `.${parts[parts.length - 1].toLowerCase()}`;
    }
    return '.jpg';
  }
}

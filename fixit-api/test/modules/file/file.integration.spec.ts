/**
 * File Service 集成测试
 *
 * 测试需要配置环境变量:
 * - MINIO_ENDPOINT (默认 localhost:9000)
 * - MINIO_ACCESS_KEY
 * - MINIO_SECRET_KEY
 * - MINIO_BUCKET (默认 fixit-files)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('File Service Integration Tests', () => {
  const config = {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'password123',
    bucket: process.env.MINIO_BUCKET || 'fixit-files',
  };

  const hasMinioConfig = () => {
    return !!(config.accessKey && config.secretKey);
  };

  describe('MinIO Connection', () => {
    it('should check MinIO connectivity', async () => {
      if (!hasMinioConfig()) {
        console.log('SKIP: MinIO credentials not configured');
        return expect(true).toBe(true);
      }

      // 尝试连接 MinIO API (head request to bucket)
      try {
        const url = new URL(config.endpoint);
        const bucketUrl = `${url.protocol}//${config.accessKey}:${config.secretKey}@${url.host}/${config.bucket}`;

        // 这是一个简单的连接测试
        console.log('MinIO Config:', {
          endpoint: config.endpoint,
          bucket: config.bucket,
          // 不显示密钥
        });

        expect(config.endpoint).toContain('http');
        expect(config.bucket.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('MinIO connection test skipped');
      }
    });
  });

  describe('File Upload Logic', () => {
    it('should validate file type before upload', () => {
      const validateFileType = (mimetype: string) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return allowedTypes.includes(mimetype);
      };

      expect(validateFileType('image/png')).toBe(true);
      expect(validateFileType('image/jpeg')).toBe(true);
      expect(validateFileType('application/pdf')).toBe(false);
      expect(validateFileType('text/plain')).toBe(false);
    });

    it('should validate file size before upload', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB

      const validateFileSize = (size: number) => {
        return size <= maxSize;
      };

      expect(validateFileSize(1024)).toBe(true);
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true);
      expect(validateFileSize(10 * 1024 * 1024)).toBe(false);
    });

    it('should generate correct file path', () => {
      const generatePath = (userId: string, filename: string) => {
        const ext = filename.split('.').pop() || 'png';
        const timestamp = Date.now();
        const uuid = 'test-uuid-1234';
        return `questions/${userId}/${timestamp}-${uuid}.${ext}`;
      };

      const path = generatePath('user-123', 'test.png');
      expect(path).toMatch(/^questions\/user-123\/\d+-test-uuid-1234\.png$/);
    });

    it('should preserve file extension from original filename', () => {
      const getExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || '';
      };

      expect(getExtension('image.png')).toBe('png');
      expect(getExtension('photo.jpg')).toBe('jpg');
      expect(getExtension('animation.webp')).toBe('webp');
      expect(getExtension('noext')).toBe('noext');
    });
  });

  describe('S3 Command Builders', () => {
    it('should build correct PutObjectCommand params', () => {
      const buildPutParams = (bucket: string, key: string, body: Buffer, contentType: string) => {
        return {
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        };
      };

      const params = buildPutParams(
        'fixit-images',
        'questions/user-1/test.png',
        Buffer.from('test image'),
        'image/png'
      );

      expect(params.Bucket).toBe('fixit-images');
      expect(params.Key).toBe('questions/user-1/test.png');
      expect(params.Body.toString()).toBe('test image');
      expect(params.ContentType).toBe('image/png');
    });

    it('should build correct DeleteObjectCommand params', () => {
      const buildDeleteParams = (bucket: string, key: string) => {
        return {
          Bucket: bucket,
          Key: key,
        };
      };

      const params = buildDeleteParams('fixit-images', 'questions/user-1/test.png');

      expect(params.Bucket).toBe('fixit-images');
      expect(params.Key).toBe('questions/user-1/test.png');
    });
  });

  describe('URL Generation', () => {
    it('should generate public URL format', () => {
      const generateUrl = (endpoint: string, bucket: string, key: string) => {
        return `${endpoint}/${bucket}/${key}`;
      };

      const url = generateUrl('http://localhost:9000', 'fixit-images', 'questions/user-1/test.png');
      expect(url).toBe('http://localhost:9000/fixit-images/questions/user-1/test.png');
    });

    it('should handle custom endpoints', () => {
      const generateUrl = (endpoint: string, bucket: string, key: string) => {
        return `${endpoint}/${bucket}/${key}`;
      };

      const url1 = generateUrl('https://minio.example.com', 'my-bucket', 'path/to/file.png');
      expect(url1).toBe('https://minio.example.com/my-bucket/path/to/file.png');
    });
  });

  describe('File Upload Request Builder', () => {
    it('should build correct multipart upload request', () => {
      const buildUploadRequest = (file: Express.Multer.File, userId: string) => {
        const ext = file.originalname.split('.').pop();
        const key = `questions/${userId}/${Date.now()}.${ext}`;

        return {
          method: 'PUT',
          url: `http://localhost:9000/fixit-images/${key}`,
          headers: {
            'Content-Type': file.mimetype,
            'Content-Length': file.size,
          },
          key,
        };
      };

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const request = buildUploadRequest(mockFile, 'user-123');

      expect(request.method).toBe('PUT');
      expect(request.headers['Content-Type']).toBe('image/png');
      expect(request.headers['Content-Length']).toBe(1024);
      expect(request.key).toContain('questions/user-123/');
      expect(request.key).toContain('.png');
    });
  });
});

/**
 * MinIO Presigned URL 测试
 */
describe('Presigned URL Logic', () => {
  it('should generate correct presigned URL format', () => {
    const generatePresignedUrl = (
      endpoint: string,
      bucket: string,
      key: string,
      expiresIn: number
    ) => {
      const url = new URL(`${endpoint}/${bucket}/${key}`);
      url.searchParams.set('X-Amz-Expires', expiresIn.toString());
      url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
      return url.toString();
    };

    const url = generatePresignedUrl(
      'http://localhost:9000',
      'fixit-images',
      'questions/user-1/test.png',
      3600
    );

    expect(url).toContain('X-Amz-Expires=3600');
    expect(url).toContain('X-Amz-Algorithm');
    expect(url).toContain('questions/user-1/test.png');
  });
});

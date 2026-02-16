import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTagDto) {
    // 检查是否已存在同名的标签
    const existing = await this.prisma.tag.findFirst({
      where: { name: dto.name, userId },
    });

    if (existing) {
      throw new ConflictException('标签已存在');
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: dto.name,
        category: dto.category || '自定义',
        color: dto.color || '#1890ff',
        type: 'CUSTOM',
        userId,
      },
    });

    return tag;
  }

  async findAll(userId: string, category?: string) {
    const where: any = { userId };
    if (category) {
      where.category = category;
    }

    const tags = await this.prisma.tag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return tags;
  }

  async findOne(userId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    return tag;
  }

  async update(userId: string, id: string, dto: UpdateTagDto) {
    await this.findOne(userId, id);

    const tag = await this.prisma.tag.update({
      where: { id },
      data: dto,
    });

    return tag;
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.tag.delete({
      where: { id },
    });

    return { success: true };
  }

  async getCategories(userId: string) {
    const categories = await this.prisma.tag.findMany({
      where: { userId },
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map((c) => c.category);
  }

  /**
   * 定时清理未被任何题目使用的标签
   * 每天凌晨 3 点执行
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupUnusedTags() {
    this.logger.log('开始清理未使用的标签...');

    try {
      // 查找所有未被使用的标签（没有任何题目关联）
      const unusedTags = await this.prisma.tag.findMany({
        where: {
          questions: {
            none: {},
          },
          // 只清理自定义标签，系统标签保留
          type: 'CUSTOM',
        },
      });

      if (unusedTags.length === 0) {
        this.logger.log('没有需要清理的未使用标签');
        return;
      }

      const deletedCount = await this.prisma.tag.deleteMany({
        where: {
          id: {
            in: unusedTags.map((tag) => tag.id),
          },
        },
      });

      this.logger.log(
        `清理完成，删除了 ${deletedCount.count} 个未使用的标签`,
      );
    } catch (error) {
      this.logger.error('清理未使用标签失败', error);
    }
  }

  /**
   * 手动触发清理未使用标签（供管理接口调用）
   */
  async manualCleanup(userId?: string) {
    const whereClause: any = {
      questions: {
        none: {},
      },
      type: 'CUSTOM',
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const unusedTags = await this.prisma.tag.findMany({
      where: whereClause,
    });

    if (unusedTags.length === 0) {
      return { deletedCount: 0, message: '没有需要清理的未使用标签' };
    }

    const deletedCount = await this.prisma.tag.deleteMany({
      where: {
        id: {
          in: unusedTags.map((tag) => tag.id),
        },
      },
    });

    return {
      deletedCount: deletedCount.count,
      message: `删除了 ${deletedCount.count} 个未使用的标签`,
    };
  }
}

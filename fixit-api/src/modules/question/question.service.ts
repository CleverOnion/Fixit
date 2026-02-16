import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto } from './dto/question.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateQuestionDto) {
    // 处理标签
    const tagConnect: { tagId: string }[] = [];
    if (dto.tags && dto.tags.length > 0) {
      for (const tagName of dto.tags) {
        const tag = await this.prisma.tag.findFirst({
          where: { name: tagName, userId },
        });
        if (tag) {
          tagConnect.push({ tagId: tag.id });
        }
      }
    }

    const question = await this.prisma.question.create({
      data: {
        content: dto.content,
        answer: dto.answer,
        analysis: dto.analysis,
        subject: dto.subject,
        userId,
        tags: tagConnect.length > 0
          ? {
              create: tagConnect,
            }
          : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.sanitizeQuestion(question);
  }

  async findAll(userId: string, filter: QuestionFilterDto) {
    const { page = 1, pageSize = 20, subject, tag, search, masteryLevel } = filter;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };

    if (subject) {
      where.subject = subject;
    }

    if (masteryLevel !== undefined) {
      where.masteryLevel = masteryLevel;
    }

    // 多字段搜索：支持搜索内容、答案、学科
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { answer: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    // 标签筛选（精确匹配标签名）
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    } else if (search) {
      // 如果有搜索词且没有标签筛选，也尝试匹配标签名
      where.tags = {
        some: {
          tag: {
            name: { contains: search },
          },
        },
      };
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      data: questions.map((q) => this.sanitizeQuestion(q)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(userId: string, id: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, userId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    return this.sanitizeQuestion(question);
  }

  async update(userId: string, id: string, dto: UpdateQuestionDto) {
    const existingQuestion = await this.findOne(userId, id);

    // 处理标签更新
    if (dto.tags !== undefined) {
      // 删除现有的所有标签关联
      await this.prisma.questionTag.deleteMany({
        where: { questionId: id },
      });

      // 添加新的标签关联
      const tagConnect: { tagId: string }[] = [];
      for (const tagName of dto.tags) {
        const tag = await this.prisma.tag.findFirst({
          where: { name: tagName, userId },
        });
        if (tag) {
          tagConnect.push({ tagId: tag.id });
        }
      }

      if (tagConnect.length > 0) {
        await this.prisma.questionTag.createMany({
          data: tagConnect.map((t) => ({
            questionId: id,
            tagId: t.tagId,
          })),
        });
      }
    }

    const question = await this.prisma.question.update({
      where: { id },
      data: {
        content: dto.content,
        answer: dto.answer,
        analysis: dto.analysis,
        subject: dto.subject,
        masteryLevel: dto.masteryLevel,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.sanitizeQuestion(question);
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.question.delete({
      where: { id },
    });

    return { success: true };
  }

  async getSubjects(userId: string, search?: string) {
    const where: any = { userId };

    if (search) {
      where.subject = {
        contains: search,
      };
    }

    const subjects = await this.prisma.question.findMany({
      where,
      select: { subject: true },
      distinct: ['subject'],
      take: 20,
    });

    return subjects.map((s) => s.subject);
  }

  // 顺序刷题：按时间/ID顺序获取题目
  async getSequential(
    userId: string,
    options: {
      subjects?: string[];
      tags?: string[];
      minMasteryLevel?: number;
      maxMasteryLevel?: number;
      limit?: number;
      orderBy?: 'asc' | 'desc';
    } = {},
  ) {
    const { subjects, tags, minMasteryLevel, maxMasteryLevel, limit = 10, orderBy = 'desc' } = options;

    const where: any = { userId };

    // 学科多选筛选
    if (subjects && subjects.length > 0) {
      where.subject = { in: subjects };
    }

    if (minMasteryLevel !== undefined || maxMasteryLevel !== undefined) {
      where.masteryLevel = {};
      if (minMasteryLevel !== undefined) {
        where.masteryLevel.gte = minMasteryLevel;
      }
      if (maxMasteryLevel !== undefined) {
        where.masteryLevel.lte = maxMasteryLevel;
      }
    }

    // 标签多选筛选
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    const questions = await this.prisma.question.findMany({
      where,
      take: limit,
      orderBy: { createdAt: orderBy },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return questions;
  }

  // 随机练习：随机抽取题目
  async getRandom(
    userId: string,
    options: {
      subjects?: string[];
      tags?: string[];
      minMasteryLevel?: number;
      maxMasteryLevel?: number;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const { subjects, tags, minMasteryLevel, maxMasteryLevel, limit = 10, offset = 0 } = options;

    const where: any = { userId };

    // 学科多选筛选
    if (subjects && subjects.length > 0) {
      where.subject = { in: subjects };
    }

    // 掌握程度范围筛选
    if (minMasteryLevel !== undefined || maxMasteryLevel !== undefined) {
      where.masteryLevel = {};
      if (minMasteryLevel !== undefined) {
        where.masteryLevel.gte = minMasteryLevel;
      }
      if (maxMasteryLevel !== undefined) {
        where.masteryLevel.lte = maxMasteryLevel;
      }
    }

    // 标签多选筛选
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    // 获取所有匹配的题目，然后在应用层随机打乱
    const questions = await this.prisma.question.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Fisher-Yates 随机打乱
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(offset, offset + limit);
  }

  // 专项训练：按学科/标签筛选
  async getBySubject(
    userId: string,
    options: {
      subjects?: string[];
      tags?: string[];
      limit?: number;
    } = {},
  ) {
    const { subjects, tags, limit = 20 } = options;

    const where: any = { userId };

    // 学科多选筛选
    if (subjects && subjects.length > 0) {
      where.subject = { in: subjects };
    }

    // 标签多选筛选
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    const questions = await this.prisma.question.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return questions;
  }

  // 根据 ID 列表获取题目（用于 PDF 导出）
  async getByIds(userId: string, ids: string[]) {
    const questions = await this.prisma.question.findMany({
      where: {
        userId,
        id: { in: ids },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return questions;
  }

  // 获取所有题目（用于 PDF 导出）
  async getAllForExport(userId: string) {
    const questions = await this.prisma.question.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return questions;
  }

  private sanitizeQuestion(question: any) {
    const { reviewLogs, userId, ...result } = question;
    return result;
  }

  // 导出所有题目为JSON
  async exportQuestions(userId: string, includeMeta: boolean = false) {
    const questions = await this.prisma.question.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const exportedData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      includeMeta,
      questions: questions.map((q) => ({
        content: q.content,
        answer: q.answer,
        analysis: q.analysis,
        images: q.images,
        subject: q.subject,
        tags: q.tags.map((t) => t.tag.name),
        ...(includeMeta && {
          masteryLevel: q.masteryLevel,
          nextReviewAt: q.nextReviewAt?.toISOString(),
          lastReviewedAt: q.lastReviewedAt?.toISOString(),
        }),
      })),
    };

    return exportedData;
  }

  // 导入题目
  async importQuestions(
    userId: string,
    data: {
      questions: {
        content: string;
        answer: string;
        analysis?: string;
        images: string[];
        subject: string;
        tags: string[];
        masteryLevel?: number;
        nextReviewAt?: string;
        lastReviewedAt?: string;
      }[];
    },
    includeMeta: boolean = false,
  ) {
    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const q of data.questions) {
      try {
        // 查找或创建标签
        const tagConnect: { tagId: string }[] = [];
        for (const tagName of q.tags) {
          let tag = await this.prisma.tag.findFirst({
            where: { name: tagName, userId },
          });

          if (!tag) {
            // 创建新标签
            tag = await this.prisma.tag.create({
              data: {
                name: tagName,
                userId,
                category: 'custom',
                type: 'CUSTOM',
              },
            });
          }

          if (tag) {
            tagConnect.push({ tagId: tag.id });
          }
        }

        // 设置元数据
        const metaData: any = {};
        if (includeMeta && q.masteryLevel !== undefined) {
          metaData.masteryLevel = q.masteryLevel;
        }
        if (includeMeta && q.nextReviewAt) {
          metaData.nextReviewAt = new Date(q.nextReviewAt);
        }
        if (includeMeta && q.lastReviewedAt) {
          metaData.lastReviewedAt = new Date(q.lastReviewedAt);
        }

        // 检查是否已存在相同内容+答案的题目
        const existing = await this.prisma.question.findFirst({
          where: {
            userId,
            content: q.content,
            answer: q.answer,
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // 创建新题目
        await this.prisma.question.create({
          data: {
            content: q.content,
            answer: q.answer,
            analysis: q.analysis,
            images: q.images || [],
            subject: q.subject,
            userId,
            tags:
              tagConnect.length > 0
                ? {
                    create: tagConnect,
                  }
                : undefined,
            ...metaData,
          },
        });

        results.success++;
      } catch (error) {
        results.errors.push(`导入题目 "${q.content.slice(0, 30)}..." 失败: ${error}`);
      }
    }

    return results;
  }

  // 随机抽题（返回题目ID列表，不更新复习时间）
  async randomPick(
    userId: string,
    options: {
      limit?: number;
      subjects?: string[];
      tags?: string[];
      minMasteryLevel?: number;
      maxMasteryLevel?: number;
    } = {},
  ): Promise<{ questionIds: string[] }> {
    const { subjects, tags, minMasteryLevel, maxMasteryLevel, limit = 20 } = options;

    const where: any = { userId };

    // 学科多选筛选
    if (subjects && subjects.length > 0) {
      where.subject = { in: subjects };
    }

    // 掌握程度范围筛选
    if (minMasteryLevel !== undefined || maxMasteryLevel !== undefined) {
      where.masteryLevel = {};
      if (minMasteryLevel !== undefined) {
        where.masteryLevel.gte = minMasteryLevel;
      }
      if (maxMasteryLevel !== undefined) {
        where.masteryLevel.lte = maxMasteryLevel;
      }
    }

    // 标签多选筛选
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    // 获取所有匹配的题目
    const questions = await this.prisma.question.findMany({
      where,
      select: { id: true },
    });

    if (questions.length === 0) {
      throw new Error('暂没有符合筛选条件的题目');
    }

    // Fisher-Yates 随机打乱
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
      questionIds: shuffled.slice(0, limit).map((q) => q.id),
    };
  }
}

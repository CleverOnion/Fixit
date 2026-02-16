import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateInvitationCodeDto } from './dto/invitation.dto';

@Injectable()
export class InvitationService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建邀请码
   */
  async create(userId: string, dto: CreateInvitationCodeDto) {
    // 如果未提供code，自动生成一个
    const code = dto.code || this.generateCode();

    // 如果指定了code，检查是否已存在
    if (dto.code) {
      const existing = await this.prisma.invitationCode.findUnique({
        where: { code },
      });
      if (existing) {
        throw new ForbiddenException('该邀请码已被使用');
      }
    }

    const invitationCode = await this.prisma.invitationCode.create({
      data: {
        code,
        createdBy: userId,
      },
    });

    return invitationCode;
  }

  /**
   * 获取当前用户创建的所有邀请码
   */
  async findAllByUser(userId: string) {
    const codes = await this.prisma.invitationCode.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });

    return codes;
  }

  /**
   * 获取所有未使用的邀请码（系统创建）
   */
  async findAllAvailable() {
    const codes = await this.prisma.invitationCode.findMany({
      where: {
        usedBy: null,
        createdBy: null, // 系统创建的邀请码
      },
      orderBy: { createdAt: 'desc' },
    });

    return codes;
  }

  /**
   * 删除邀请码（只能删除自己创建的）
   */
  async delete(userId: string, id: string) {
    const invitationCode = await this.prisma.invitationCode.findFirst({
      where: { id, createdBy: userId },
    });

    if (!invitationCode) {
      throw new NotFoundException('邀请码不存在或无权删除');
    }

    // 如果已被使用，不能删除
    if (invitationCode.usedBy) {
      throw new ForbiddenException('已使用的邀请码无法删除');
    }

    await this.prisma.invitationCode.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * 验证邀请码是否有效
   */
  async validateCode(code: string) {
    const invitationCode = await this.prisma.invitationCode.findUnique({
      where: { code },
    });

    if (!invitationCode) {
      return { valid: false, error: '邀请码不存在' };
    }

    if (invitationCode.usedBy) {
      return { valid: false, error: '邀请码已被使用' };
    }

    return { valid: true, invitationCode };
  }

  /**
   * 使用邀请码
   */
  async useCode(code: string, userId: string) {
    const invitationCode = await this.prisma.invitationCode.findUnique({
      where: { code },
    });

    if (!invitationCode) {
      throw new NotFoundException('邀请码不存在');
    }

    if (invitationCode.usedBy) {
      throw new ForbiddenException('邀请码已被使用');
    }

    const updated = await this.prisma.invitationCode.update({
      where: { code },
      data: {
        usedBy: userId,
        usedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * 生成随机邀请码
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

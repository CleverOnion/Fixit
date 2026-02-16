import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('邮箱已被注册');
    }

    // 验证邀请码
    const invitationCode = await this.prisma.invitationCode.findUnique({
      where: { code: dto.invitationCode },
    });

    if (!invitationCode) {
      throw new ForbiddenException('邀请码不存在');
    }

    if (invitationCode.usedBy) {
      throw new ForbiddenException('邀请码已被使用');
    }

    // 标记邀请码为已使用
    await this.prisma.invitationCode.update({
      where: { code: dto.invitationCode },
      data: {
        usedBy: '', // 用户ID会在下面创建后更新
      },
    });

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        nickname: dto.nickname,
      },
    });

    // 更新邀请码的使用者
    await this.prisma.invitationCode.update({
      where: { code: dto.invitationCode },
      data: {
        usedBy: user.id,
        usedAt: new Date(),
      },
    });

    const token = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: { nickname?: string; avatar?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.sanitizeUser(user);
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  private sanitizeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }
}

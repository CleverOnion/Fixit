import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { CreateInvitationCodeDto } from './dto/invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  /**
   * 创建邀请码
   */
  @Post()
  async create(@Request() req: any, @Body() dto: CreateInvitationCodeDto) {
    return this.invitationService.create(req.user.sub, dto);
  }

  /**
   * 获取当前用户创建的所有邀请码
   */
  @Get()
  async findAll(@Request() req: any) {
    return this.invitationService.findAllByUser(req.user.sub);
  }

  /**
   * 删除邀请码
   */
  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.invitationService.delete(req.user.sub, id);
  }
}

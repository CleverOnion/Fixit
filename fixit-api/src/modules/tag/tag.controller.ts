import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
  constructor(private tagService: TagService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateTagDto) {
    return this.tagService.create(req.user.sub, dto);
  }

  @Get()
  async findAll(@Request() req: any, @Query('category') category?: string) {
    return this.tagService.findAll(req.user.sub, category);
  }

  @Get('categories')
  async getCategories(@Request() req: any) {
    return this.tagService.getCategories(req.user.sub);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.tagService.findOne(req.user.sub, id);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.tagService.delete(req.user.sub, id);
  }
}

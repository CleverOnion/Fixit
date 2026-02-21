import { IsString, IsOptional, IsArray, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateQuestionDto {
  @IsString()
  content: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsString()
  analysis?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsString()
  analysis?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsNumber()
  masteryLevel?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class QuestionFilterDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsNumber()
  masteryLevel?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  pageSize?: number = 20;
}

// 练习模式筛选 DTO
export class PracticeFilterDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }
    return value;
  })
  subjects?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }
    return value;
  })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  minMasteryLevel?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  maxMasteryLevel?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  offset?: number = 0;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  orderBy?: 'asc' | 'desc' = 'desc';
}

// 导出题目数据格式
export interface ExportedQuestion {
  content: string;
  answer: string;
  analysis?: string;
  remark?: string;
  images: string[];
  subject: string;
  tags: string[];
  // 元数据（可选）
  masteryLevel?: number;
  nextReviewAt?: string;
  lastReviewedAt?: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  totalQuestions: number;
  includeMeta: boolean;
  questions: ExportedQuestion[];
}

import { IsString, IsOptional, IsArray } from 'class-validator';

export class GenerateContentDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  instruction?: string;

  @IsString()
  @IsOptional()
  type?: 'question' | 'answer' | 'analysis';
}

export class RecognizeQuestionDto {
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsString()
  @IsOptional()
  instruction?: string;
}

export class RecognizeQuestionResponse {
  subject?: string | null;
  content?: string | null;
  answer?: string | null;
  analysis?: string | null;
}

export class GenerateAnswerDto {
  @IsString()
  question: string;

  @IsString()
  @IsOptional()
  instruction?: string;
}

export class GenerateAnalysisDto {
  @IsString()
  question: string;

  @IsString()
  @IsOptional()
  answer?: string;

  @IsString()
  @IsOptional()
  instruction?: string;
}

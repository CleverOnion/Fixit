import { IsString, IsOptional } from 'class-validator';

export class CreateInvitationCodeDto {
  @IsString()
  @IsOptional()
  code?: string; // 可选，如果不提供则自动生成
}

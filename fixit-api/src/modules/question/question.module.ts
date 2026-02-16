import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { PrismaService } from '../../prisma.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  controllers: [QuestionController],
  providers: [QuestionService, PrismaService],
  exports: [QuestionService],
  imports: [PdfModule],
})
export class QuestionModule {}

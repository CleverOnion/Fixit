import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { QuestionModule } from './modules/question/question.module';
import { FileModule } from './modules/file/file.module';
import { TagModule } from './modules/tag/tag.module';
import { AiModule } from './modules/ai/ai.module';
import { ReviewModule } from './modules/review/review.module';
import { InvitationModule } from './modules/invitation/invitation.module';

const envFilePath = path.resolve(process.cwd(), '../.env');
console.log('[Config] Loading .env from:', envFilePath);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
    }),
    AuthModule,
    QuestionModule,
    FileModule,
    TagModule,
    AiModule,
    ReviewModule,
    InvitationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

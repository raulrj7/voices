// src/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ProcessCsvConsumer } from './process-cvs.comsumer';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'csvQueue',
    }),
  ],
  providers: [UploadService, ProcessCsvConsumer],
  controllers: [UploadController],
})
export class UploadModule {}

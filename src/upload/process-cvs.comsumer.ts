import { Processor, Process } from '@nestjs/bull';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { Injectable } from '@nestjs/common';
import { UploadService } from './upload.service';

import { Job, Queue, Worker } from 'bullmq';

const jobLockKey = 'job-lock-key';

@Processor('csvQueue')
@Injectable()
export class ProcessCsvConsumer {
  private isProcessing = false;

  constructor(private readonly uploadService: UploadService) {}

  @Process('processCsv')
  async handleCsvProcessing(job: Job) {
    if (this.isProcessing) {
      console.log('El trabajo ya está en proceso');
      return; // Si ya hay un trabajo en proceso, se evita duplicarlo
    }

    try {
      this.isProcessing = true;
      let { fileBuffer } = job.data;
      if (!Buffer.isBuffer(fileBuffer)) {
        fileBuffer = Buffer.from(fileBuffer.data);
      }

      const fileStream = Readable.from(fileBuffer);
      const batchSize = 1000;
      let batch = [];

      fileStream
        .pipe(csvParser())
        .on('data', (data) => {
          batch.push(data);
          if (batch.length === batchSize) {
            this.uploadService.processBatch(batch);
            batch = [];
          }
        })
        .on('end', async () => {
          if (batch.length > 0) {
            await this.uploadService.processBatch(batch);
          }
          console.log('Archivo procesado completamente');
        });
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}


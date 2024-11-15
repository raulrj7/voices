import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { Injectable } from '@nestjs/common';
import { UploadService } from './upload.service';

@Processor('csvQueue')
@Injectable()
export class ProcessCsvConsumer {
  constructor(private readonly uploadService: UploadService) {}

  @Process('processCsv')
  async handleCsvProcessing(job: Job) {

    let { fileBuffer } = job.data;
    if (!Buffer.isBuffer(fileBuffer)) {
      fileBuffer = Buffer.from(fileBuffer.data);
    }

    const fileStream = Readable.from(fileBuffer);
    const batchSize = 1000;
    let batch = [];

    fileStream
      .pipe(csvParser())
      .on('data', async (data) => {
        batch.push(data);
        if (batch.length === batchSize) {
          await this.uploadService.processBatch(batch);
          batch = [];
        }
      })
      .on('end', async () => {
        // Procesa el lote restante si no está vacío
        if (batch.length > 0) {
          await this.uploadService.processBatch(batch);
        }
        console.log('Archivo procesado completamente');
      });
  }
}

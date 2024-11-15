import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { Readable } from 'stream';

interface ValidRecord {
  number: string;
  message: string;
}

interface ErrorRecord {
  number: string | null;
  message: string | null;
  error: string;
}

@Injectable()
export class UploadService {
  private prisma = new PrismaClient();

  async processBatch(records: Record<string, any>[]) {
    const validRecords: ValidRecord[] = [];
    const invalidRecords: ErrorRecord[] = [];
  
    for (const record of records) {
      const { valid, error } = this.validateRecord(record);
  
      if (valid) {
        // Filtramos solo `number` y `message` para los registros válidos
        validRecords.push({ number: record.number, message: record.message });
      } else {
        // Filtramos solo `number`, `message` y `error` para los registros inválidos
        invalidRecords.push({
          number: record.number || null,
          message: record.message || null,
          error: error || 'Error desconocido',
        });
      }
    }
  
    await this.saveValidRecords(validRecords);
    await this.saveInvalidRecords(invalidRecords);
  
    console.log(`Lote procesado - Válidos: ${validRecords.length}, Inválidos: ${invalidRecords.length}`);
  }
  

  private replaceMessageVariables(message: string, record: Record<string, any>): string {
    return message.replace(/\{\{(.*?)\}\}/g, (_, variable) => record[variable] || `{{${variable}}}`);
  }

  validateRecord(record: Record<string, any>): { valid: boolean, error?: string } {
    const { number, message } = record;

    if (!number || typeof number !== 'string' || number.length < 10 || isNaN(Number(number))) {
      return { valid: false, error: 'Número inválido: debe ser numérico y tener al menos 10 caracteres' };
    }

    if (!message || typeof message !== 'string' || message.length === 0) {
      return { valid: false, error: 'Mensaje ausente' };
    }

    if (message.length > 170) {
      record.message = message.slice(0, 170);
    }

    return { valid: true };
  }

  createErrorMessage(record: Record<string, any>, errorDetail: string): ErrorRecord {
    return {
      number: record['number'] || null,
      message: record['message'] || null,
      error: errorDetail,
    };
  }

  async saveValidRecords(records: ValidRecord[]) {
    if (records.length > 1000) {
      await this.bulkInsertWithCopy(records);
    } else {
      await this.prisma.successMessage.createMany({
        data: records,
      });
    }

    console.log('Registros válidos guardados en la base de datos');
  }

  async saveInvalidRecords(records: ErrorRecord[]) {
    if (records.length > 0) {
      await this.prisma.errorMessage.createMany({
        data: records,
      });
    }

    console.log('Registros inválidos guardados en la base de datos');
  }

  private async bulkInsertWithCopy(records: ValidRecord[]) {
    try {
      const copyQuery = 
        `COPY successMessage(number, message) FROM STDIN WITH CSV HEADER DELIMITER ',';`;
      const fileStream = this.createCsvStream(records);

      console.log('Registros insertados con COPY');
    } catch (error) {
      console.error('Error al insertar con COPY:', error);
    }
  }

  private createCsvStream(records: ValidRecord[]): Readable {
    const csvString = records
      .map(record => `${record.number},${record.message}`)
      .join('\n');
    return Readable.from(csvString);
  }

  async searchMessages(dto: SearchMessagesDto) {
    const { number, startDate, endDate, message, page, pageSize } = dto;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const query = await this.prisma.successMessage.findMany({
      where: {
        ...(number && { number: { contains: number } }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(message && { message: { contains: message } }),
      },
      skip,
      take,
    });

    const totalRecords = await this.prisma.successMessage.count({
      where: {
        ...(number && { number: { contains: number } }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(message && { message: { contains: message } }),
      },
    });

    return {
      data: query,
      meta: {
        totalRecords,
        page,
        pageSize,
        totalPages: Math.ceil(totalRecords / pageSize),
      },
    };
  }
}

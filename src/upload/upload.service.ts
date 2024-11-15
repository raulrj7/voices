import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { Readable } from 'stream';
import { createPgClient } from '../database/postgres-config';

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

  // Procesa un lote de registros, validándolos y separando los válidos de los inválidos
  async processBatch(records: Record<string, any>[]) {
    const validRecords: ValidRecord[] = [];
    const invalidRecords: ErrorRecord[] = [];

    try {
      for (const record of records) {
        const { valid, error } = this.validateRecord(record);

        if (valid) {
          validRecords.push({ number: record.number, message: record.message });
        } else {
          invalidRecords.push({
            number: record.number || null,
            message: record.message || null,
            error: error || 'Error desconocido',
          });
        }
      }

      await this.saveValidRecords(validRecords);
      await this.saveInvalidRecords(invalidRecords);
    } catch (error) {
      console.error('Error en el procesamiento del lote:', error);
    }
  }

  // Reemplaza las variables en el mensaje con valores de un registro específico
  private replaceMessageVariables(message: string, record: Record<string, any>): string {
    try {
      return message.replace(/\{\{(.*?)\}\}/g, (_, variable) => record[variable] || `{{${variable}}}`);
    } catch (error) {
      console.error('Error al reemplazar variables en el mensaje:', error);
      return message;
    }
  }

  // Valida un registro, asegurando que el número y el mensaje sean correctos y que las variables estén definidas
  validateRecord(record: Record<string, any>): { valid: boolean; error?: string } {
    try {
      const { number, message } = record;

      if (!number || typeof number !== 'string' || number.length < 10 || isNaN(Number(number))) {
        return { valid: false, error: 'Número inválido: debe ser numérico y tener al menos 10 caracteres' };
      }

      if (!message || typeof message !== 'string' || message.length === 0) {
        return { valid: false, error: 'Mensaje ausente' };
      }

      const variableMatches = message.match(/\{\{(.*?)\}\}/g);
      if (variableMatches) {
        for (const variable of variableMatches) {
          const key = variable.replace(/\{\{|\}\}/g, '');
          const value = record[key];

          if (value === undefined) {
            return { valid: false, error: `Variable faltante: "${key}" no encontrada en el registro` };
          }

          if (value === null || value === '') {
            return { valid: false, error: `Variable "${key}" tiene un valor vacío en el registro` };
          }
        }

        record.message = this.replaceMessageVariables(message, record);
      }

      if (message.length > 170) {
        record.message = message.slice(0, 170);
      }

      return { valid: true };
    } catch (error) {
      console.error('Error al validar el registro:', error);
      return { valid: false, error: 'Error en la validación del registro' };
    }
  }

  // Crea un mensaje de error a partir de un registro
  createErrorMessage(record: Record<string, any>, errorDetail: string): ErrorRecord {
    try {
      return {
        number: record['number'] || null,
        message: record['message'] || null,
        error: errorDetail,
      };
    } catch (error) {
      console.error('Error al crear el mensaje de error:', error);
      return {
        number: null,
        message: null,
        error: 'Error al crear mensaje de error',
      };
    }
  }

  // Guarda los registros válidos en la base de datos, usando un método optimizado si el número es grande
  async saveValidRecords(records: ValidRecord[]) {
    try {
      if (records.length > 1000) {
        await this.bulkInsertWithCopy(records);
      } else {
        await this.prisma.successMessage.createMany({
          data: records,
        });
      }
    } catch (error) {
      console.error('Error al guardar los registros válidos:', error);
      throw new Error('Error al guardar los registros válidos');
    }
  }

  // Guarda los registros inválidos en la base de datos
  async saveInvalidRecords(records: ErrorRecord[]) {
    try {
      if (records.length > 0) {
        await this.prisma.errorMessage.createMany({
          data: records,
        });
      }
    } catch (error) {
      console.error('Error al guardar los registros inválidos:', error);
      throw new Error('Error al guardar los registros inválidos');
    }
  }

  // Realiza una inserción masiva de registros usando el comando COPY de PostgreSQL
  private async bulkInsertWithCopy(records: ValidRecord[]) {
    try {
      const client = createPgClient();
      await client.connect();

      const copyQuery =
        `COPY successMessage(number, message) FROM STDIN WITH CSV HEADER DELIMITER ',';`;

      const fileStream = this.createCsvStream(records);

      await client.query(copyQuery, [fileStream]);

      await client.end();
    } catch (error) {
      console.error('Error al insertar con COPY:', error);
      throw new Error('Error al insertar con COPY');
    }
  }

  // Crea un stream CSV a partir de los registros válidos
  private createCsvStream(records: ValidRecord[]): Readable {
    try {
      const csvString = records
        .map(record => `${record.number},${record.message}`)
        .join('\n');

      return Readable.from(csvString);
    } catch (error) {
      console.error('Error al crear el stream CSV:', error);
      throw new Error('Error al crear el stream CSV');
    }
  }

  // Realiza una búsqueda de mensajes en la base de datos, soportando filtros de número, fechas y mensaje
  async searchMessages(dto: SearchMessagesDto) {
    try {
      const { number, startDate, endDate, message, page, pageSize } = dto;
      const skip = Number((page - 1) * pageSize);
      const take = Number(pageSize);
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
        skip: skip? skip: 0,
        take: take? take: 10,
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
          page: page? Number(page) : 1,
          pageSize: pageSize? Number(pageSize): 10,
          totalPages: Math.ceil(totalRecords / (pageSize ? Number(pageSize): 10)),
        },
      };
    } catch (error) {
      console.error('Error al realizar la búsqueda de mensajes:', error);
      throw new Error('Error en la búsqueda de mensajes');
    }
  }
}

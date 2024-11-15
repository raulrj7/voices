import { Controller, Post, Get, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { UploadService } from './upload.service';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { ApiResponse, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    @InjectQueue('csvQueue') private readonly csvQueue: Queue,
  ) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir un archivo CSV para procesamiento' })
  @ApiBody({
    description: 'Archivo CSV para ser procesado',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo encolado para procesamiento',
    content: {
      'application/json': {
        example: {
          message: 'Archivo encolado para procesamiento en segundo plano',
        },
      },
    },
  })
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    console.log('Archivo recibido, encolando para procesamiento');

    // Encolar el trabajo para ser procesado por Bull en segundo plano
    await this.csvQueue.add('processCsv', {
      fileBuffer: file.buffer,
    });

    return { message: 'Archivo encolado para procesamiento en segundo plano' };
  }

  @Get('search-messages')
  @ApiOperation({ summary: 'Buscar registros de mensajes' })
  @ApiResponse({
    status: 200,
    description: 'Retorna los registros de mensajes filtrados.',
    content: {
      'application/json': {
        example: {
          data: [
            {
              number: '1234567890',
              message: 'Mensaje de ejemplo',
              createdAt: '2024-11-14T12:00:00Z',
            },
          ],
          meta: {
            totalRecords: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          },
        },
      },
    },
  })
  async searchMessages(
    @Query() query: SearchMessagesDto,
  ) {
    return await this.uploadService.searchMessages(query);
  }
}

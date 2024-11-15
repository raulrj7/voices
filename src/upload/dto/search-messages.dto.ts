import { IsOptional, IsString, IsInt, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchMessagesDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Número de mensaje para buscar',
    required: false,
  })
  number?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Fecha de inicio para el filtro de búsqueda',
    required: false,
  })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Fecha de fin para el filtro de búsqueda',
    required: false,
  })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Mensaje para buscar',
    required: false,
  })
  message?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Número de página',
    default: 1,
    required: false,
  })
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({
    description: 'Tamaño de la página',
    default: 10,
    required: false,
  })
  pageSize: number = 10;
}

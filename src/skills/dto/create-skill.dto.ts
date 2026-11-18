import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({
    example: 'Фотография',
    description: 'Название навыка',
    maxLength: 255,
  })
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example: 'Видеомонтаж',
    description: 'Описание навыка',
  })
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    example: 2,
    description: 'ID категории',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiPropertyOptional({
    example: ['/uploads/react-1.png'],
    description: 'Список URL изображений',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

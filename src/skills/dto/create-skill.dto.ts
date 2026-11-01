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

export class CreateSkillDto {
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { UserGender } from '../users.enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Иван Иванов',
    description: 'Имя',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'new@example.com',
    description: 'Email',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    example: 'Люблю обмениваться навыками',
    description: 'О себе',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  about?: string;

  @ApiPropertyOptional({
    example: '1990-01-01',
    description: 'Дата рождения',
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({
    example: 'Москва',
    description: 'Город',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    enum: UserGender,
    description: 'Пол',
    example: UserGender.MALE,
  })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL аватара',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  avatar?: string;
}

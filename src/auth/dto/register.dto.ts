import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Иван Иванов',
    description: 'Имя пользователя (2–100 символов)',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя (уникальный)',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'qwerty123',
    description: 'Пароль (8–100 символов)',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}

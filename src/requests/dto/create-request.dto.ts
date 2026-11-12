import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty({
    example: 1,
    description: 'ID навыка, который вы предлагаете (должен принадлежать вам)',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  offeredSkillId!: number;

  @ApiProperty({
    example: 2,
    description: 'ID навыка, который вы хотите получить',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requestedSkillId!: number;
}

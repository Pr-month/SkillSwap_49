import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  offeredSkillId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  requestedSkillId!: number;
}

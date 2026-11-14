import { IsEnum } from 'class-validator';
import { RequestStatus } from '../request.enums';

export class UpdateRequestDto {
  @IsEnum(RequestStatus)
  status!: RequestStatus;
}

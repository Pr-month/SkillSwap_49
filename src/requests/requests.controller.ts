import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/auth.types';

@Controller('requests')
@UseGuards(AccessTokenGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestsService.create(createRequestDto, user.sub);
  }

  @Get('outgoing')
  findOutgoing(@CurrentUser() user: JwtPayload) {
    return this.requestsService.findOutgoing(user.sub);
  }
}

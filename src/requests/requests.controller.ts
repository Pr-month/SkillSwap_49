import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/auth.types';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать заявку на обмен навыками' })
  @ApiResponse({ status: 201, description: 'Заявка создана' })
  @ApiResponse({ status: 400, description: 'Заявка самому себе' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Предлагаемый навык не ваш' })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  create(
    @Body() createRequestDto: CreateRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestsService.create(createRequestDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Список всех заявок' })
  @ApiResponse({ status: 200, description: 'Список заявок' })
  findAll() {
    return this.requestsService.findAll();
  }

  @Get('incoming')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Входящие заявки',
  })
  @ApiResponse({ status: 200, description: 'Список входящих заявок' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  findIncoming(@CurrentUser() user: JwtPayload) {
    return this.requestsService.findIncoming(user.sub);
  }

  @Get('outgoing')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Исходящие заявки',
  })
  @ApiResponse({ status: 200, description: 'Список исходящих заявок' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  findOutgoing(@CurrentUser() user: JwtPayload) {
    return this.requestsService.findOutgoing(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заявку по ID' })
  @ApiResponse({ status: 200, description: 'Заявка' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить заявку' })
  @ApiResponse({ status: 200, description: 'Заявка обновлена' })
  update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto) {
    return this.requestsService.update(+id, updateRequestDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить заявку (свою или ADMIN)' })
  @ApiResponse({ status: 200, description: 'Заявка удалена' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.requestsService.remove(+id, user);
  }
}

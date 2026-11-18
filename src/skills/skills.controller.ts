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
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/auth.types';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать навык' })
  @ApiResponse({ status: 201, description: 'Навык создан' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @UseGuards(AccessTokenGuard)
  create(
    @Body() createSkillDto: CreateSkillDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.skillsService.create(createSkillDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Список всех навыков' })
  @ApiResponse({ status: 200, description: 'Список навыков' })
  findAll() {
    return this.skillsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить навык по ID' })
  @ApiResponse({ status: 200, description: 'Навык' })
  @ApiResponse({ status: 404, description: 'Не найден' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить свой навык' })
  @ApiResponse({ status: 200, description: 'Навык обновлён' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Не ваш навык' })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSkillDto: UpdateSkillDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.skillsService.update(id, updateSkillDto, user.sub);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить свой навык' })
  @ApiResponse({ status: 200, description: 'Навык удалён' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Не ваш навык' })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.skillsService.remove(id, user.sub);
  }

  @Post(':id/favorite')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить навык в избранное' })
  @ApiResponse({ status: 201, description: 'Добавлено' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  @ApiResponse({ status: 409, description: 'Уже в избранном' })
  async addToFavorites(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.skillsService.addToFavorites(id, user.sub);
  }

  @Delete(':id/favorite')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить навык из избранного' })
  @ApiResponse({ status: 200, description: 'Удалено' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 404, description: 'Навык не найден в избранном' })
  async removeFromFavorites(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.skillsService.removeFromFavorites(id, user.sub);
  }
}

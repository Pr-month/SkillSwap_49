import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/role.decorator';
import { UserRole } from '../users/users.enums';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать категорию (только ADMIN)' })
  @ApiResponse({ status: 201, description: 'Категория создана' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Родительская категория не найдена' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Список корневых категорий с подкатегориями' })
  @ApiResponse({ status: 200, description: 'Список категорий' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить категорию по ID' })
  @ApiResponse({ status: 200, description: 'Категория' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить категорию (только ADMIN)' })
  @ApiResponse({ status: 200, description: 'Категория обновлена' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить категорию и подкатегории (только ADMIN)' })
  @ApiResponse({ status: 200, description: 'Категория удалена' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}

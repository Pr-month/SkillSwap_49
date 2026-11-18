import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { JwtPayload } from '../auth/auth.types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AccessTokenGuard)
  @UseGuards(AccessTokenGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findMe(@CurrentUser() user: JwtPayload) {
    const foundUser = await this.usersService.findById(user.sub);

    if (!foundUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    return foundUser;
  }

  @Post()
  @ApiOperation({ summary: 'Создать пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь создан' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль обновлён' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 409, description: 'Email уже существует' })
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfile: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.sub, updateProfile);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Сменить пароль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Пароль изменён' })
  @ApiResponse({ status: 401, description: 'Неверный текущий пароль' })
  @ApiResponse({ status: 400, description: 'Новый пароль совпадает с текущим' })
  async updateMyPassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePassword: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(user.sub, changePassword);
  }
}

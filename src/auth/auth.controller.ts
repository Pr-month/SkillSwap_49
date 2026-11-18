import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { type JwtPayload } from './auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { HttpCode } from '@nestjs/common';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь зарегистрирован',
  })
  @ApiResponse({ status: 409, description: 'Email уже используется' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход по email и паролю' })
  @ApiResponse({
    status: 201,
    description: 'Успешный вход',
  })
  @ApiResponse({ status: 401, description: 'Неверный email или пароль' })
  Login(@Body() login: LoginDto) {
    return this.authService.login(login);
  }

  @HttpCode(200)
  @Post('refresh')
  @ApiOperation({ summary: 'Обновление пары токенов' })
  @ApiResponse({ status: 200, description: 'Токены обновлены' })
  @ApiResponse({ status: 401, description: 'Невалидный токен' })
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Выход' })
  @ApiResponse({ status: 201, description: 'Пользователь вышел' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('REFRESH_TOKEN');
    return this.authService.logout(user.sub);
  }
}

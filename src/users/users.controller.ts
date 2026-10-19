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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async findMe(@CurrentUser() user: JwtPayload) {
    const foundUser = await this.usersService.findById(user.sub);

    if (!foundUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    return foundUser;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfile: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.sub, updateProfile);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  async updateMyPassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePassword: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(user.sub, changePassword);
  }
}

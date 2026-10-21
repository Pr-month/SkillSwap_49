import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PublicUserDto } from './dto/public-user.dto';

type CreateUserData = Pick<User, 'name' | 'email' | 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<PublicUserDto[]> {
    const users = await this.usersRepository.find();

    return users.map((user) => new PublicUserDto(user));
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  create(userData: CreateUserData): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOneBy({
        email: updateUserDto.email,
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
    }
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updatePassword(
    userId: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    const isPasswordIsValid = await compare(
      updatePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordIsValid) {
      throw new UnauthorizedException('Не верный текущий пароль');
    }
    if (updatePasswordDto.currentPassword === updatePasswordDto.newPassword) {
      throw new BadRequestException(
        'Новый пароль должен отличаться от текущего',
      );
    }
    user.password = await hash(updatePasswordDto.newPassword, 10);
    await this.usersRepository.save(user);
  }

  async updateRefreshToken(
    userId: number,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      refreshToken: refreshTokenHash,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { User } from './entities/user.entity';

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

  create(userData: CreateUserData): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
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

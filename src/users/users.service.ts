import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

type CreateUserData = Pick<User, 'name' | 'email' | 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  create(userData: CreateUserData): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async updateRefreshToken(
    userId: number,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      refreshToken: refreshTokenHash,
    });
  }
}

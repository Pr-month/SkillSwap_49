import {
  Injectable,
  ConflictException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { jwtConfig, type TJwtConfig } from '../config/jwt.config';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { type JwtPayload, type Tokens } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly config: TJwtConfig,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; tokens: Tokens }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }
    const passwordHash = await hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: passwordHash,
    });

    const tokens = await this.generateTokens(user);
    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);
    return { user, tokens };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; tokens: Tokens }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const tokens = await this.generateTokens(user);
    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    return { user, tokens };
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    if (!this.config.refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET не обнаружен');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.refreshTokenSecret,
        expiresIn: this.config.refreshTokenExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}

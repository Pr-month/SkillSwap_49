import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { jwtConfig, type TJwtConfig } from '../config/jwt.config';
import { appConfig, type TAppConfig } from '../config/app.config';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { type JwtPayload, type Tokens } from './auth.types';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly config: TJwtConfig,
    @Inject(appConfig.KEY)
    private readonly appConfig: TAppConfig,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; tokens: Tokens }> {
    const passwordHash = await hash(
      registerDto.password,
      this.appConfig.hashSalt,
    );
    let user: User;
    try {
      user = await this.usersService.create({
        ...registerDto,
        password: passwordHash,
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Email уже используется. Пожалуйста, используйте другой email.',
        );
      }

      throw error;
    }
    const tokens = await this.generateTokens(user);
    const refreshTokenHash = await hash(
      tokens.refreshToken,
      this.appConfig.hashSalt,
    );
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
    const refreshTokenHash = await hash(
      tokens.refreshToken,
      this.appConfig.hashSalt,
    );
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    return { user, tokens };
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ user: User; tokens: Tokens }> {
    if (!this.config.refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET не обнаружен');
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: this.config.refreshTokenSecret,
        },
      );
    } catch {
      throw new UnauthorizedException('Невалидный refresh token');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Доступ запрещен');
    }
    const isRefreshTokenValid = await compare(
      refreshTokenDto.refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Доступ запрещен');
    }
    const tokens = await this.generateTokens(user);
    const refreshTokenHash = await hash(
      tokens.refreshToken,
      this.appConfig.hashSalt,
    );
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

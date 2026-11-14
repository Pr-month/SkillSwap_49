import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { QueryFailedError } from 'typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { jwtConfig } from '../config/jwt.config';
import { appConfig } from '../config/app.config';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/users.enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmail: jest.Mock;
    findById: jest.Mock;
    updateRefreshToken: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  const config = {
    accessTokenSecret: 'access-secret',
    refreshTokenSecret: 'refresh-secret',
    accessTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
  };
  const appCfg = { hashSalt: 4 };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateRefreshToken: jest.fn(),
    };
    jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: jwtConfig.KEY, useValue: config },
        { provide: appConfig.KEY, useValue: appCfg },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const dto: RegisterDto = {
      name: 'Анна',
      email: 'a@b.c',
      password: 'password',
    };

    it('hashes the password, creates a user and returns tokens', async () => {
      const user = { id: 1, email: 'a@b.c', role: UserRole.USER } as User;
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hashed-password')
        .mockResolvedValueOnce('hashed-refresh');
      usersService.create.mockResolvedValue(user);
      jwtService.signAsync
        .mockResolvedValueOnce('access')
        .mockResolvedValueOnce('refresh');

      const result = await service.register(dto);

      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Анна',
        email: 'a@b.c',
        password: 'hashed-password',
      });
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        1,
        'hashed-refresh',
      );
      expect(result).toEqual({
        user,
        tokens: { accessToken: 'access', refreshToken: 'refresh' },
      });
    });

    it('throws ConflictException when the email is already taken', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const driverError = Object.assign(new Error('duplicate'), {
        code: '23505',
      });
      usersService.create.mockRejectedValue(
        new QueryFailedError('INSERT', [], driverError),
      );

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto: LoginDto = { email: 'a@b.c', password: 'password' };

    it('returns tokens for valid credentials', async () => {
      const user = {
        id: 1,
        email: 'a@b.c',
        password: 'hashed',
        role: UserRole.USER,
      } as User;
      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.signAsync
        .mockResolvedValueOnce('access')
        .mockResolvedValueOnce('refresh');

      const result = await service.login(dto);

      expect(result.tokens).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        1,
        'hashed-refresh',
      );
    });

    it('throws UnauthorizedException for an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 1,
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    const dto: RefreshTokenDto = { refreshToken: 'token' };

    it('returns new tokens for a valid refresh token', async () => {
      const payload = { sub: 1, email: 'a@b.c', role: UserRole.USER };
      const user = {
        id: 1,
        email: 'a@b.c',
        refreshToken: 'hashed-refresh',
      } as User;
      jwtService.verifyAsync.mockResolvedValue(payload);
      usersService.findById.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      jwtService.signAsync
        .mockResolvedValueOnce('access')
        .mockResolvedValueOnce('refresh');

      const result = await service.refreshTokens(dto);

      expect(result.tokens).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
    });

    it('throws UnauthorizedException for an invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the user is not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
      usersService.findById.mockResolvedValue(null);

      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the stored token does not match', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
      usersService.findById.mockResolvedValue({
        id: 1,
        refreshToken: 'stored-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('clears the refresh token', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout(1);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(1, null);
    });
  });
});

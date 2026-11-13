import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from './auth.types';

describe('AuthController', () => {
  let controller: AuthController;
  let service: {
    register: jest.Mock;
    login: jest.Mock;
    refreshTokens: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('delegates to the service', () => {
      const dto: RegisterDto = {
        name: 'Анна',
        email: 'a@b.c',
        password: 'password',
      };
      service.register.mockReturnValue('registered');

      expect(controller.register(dto)).toBe('registered');
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delegates to the service', () => {
      const dto: LoginDto = { email: 'a@b.c', password: 'password' };
      service.login.mockReturnValue('logged-in');

      expect(controller.Login(dto)).toBe('logged-in');
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refreshTokens', () => {
    it('delegates to the service', () => {
      const dto: RefreshTokenDto = { refreshToken: 'token' };
      service.refreshTokens.mockReturnValue('refreshed');

      expect(controller.refreshTokens(dto)).toBe('refreshed');
      expect(service.refreshTokens).toHaveBeenCalledWith(dto);
    });
  });

  describe('logout', () => {
    it('clears the refresh token cookie and delegates to the service', () => {
      const currentUser: JwtPayload = {
        sub: 1,
        email: 'a@b.c',
        role: UserRole.USER,
      };
      const clearCookie = jest.fn();
      const res = { clearCookie } as unknown as Response;
      service.logout.mockReturnValue(undefined);

      expect(controller.logout(currentUser, res)).toBeUndefined();
      expect(clearCookie).toHaveBeenCalledWith('REFRESH_TOKEN');
      expect(service.logout).toHaveBeenCalledWith(1);
    });
  });
});

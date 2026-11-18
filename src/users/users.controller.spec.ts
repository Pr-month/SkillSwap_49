import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserRole } from './users.enums';
import type { JwtPayload } from '../auth/auth.types';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    findById: jest.Mock;
    create: jest.Mock;
    updateProfile: jest.Mock;
    updatePassword: jest.Mock;
  };

  const currentUser: JwtPayload = {
    sub: 1,
    email: 'a@b.c',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    service = {
      findById: jest.fn(),
      create: jest.fn(),
      updateProfile: jest.fn(),
      updatePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMe', () => {
    it('returns the current user', async () => {
      const user = { id: 1, email: 'a@b.c' };
      service.findById.mockResolvedValue(user);

      await expect(controller.findMe(currentUser)).resolves.toEqual(user);
      expect(service.findById).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the user is missing', async () => {
      service.findById.mockResolvedValue(null);

      await expect(controller.findMe(currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('delegates to the service', () => {
      const dto: CreateUserDto = {
        name: 'Анна',
        email: 'a@b.c',
        password: 'password',
      };
      service.create.mockReturnValue('created');

      expect(controller.create(dto)).toBe('created');
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateMe', () => {
    it('delegates to the service', () => {
      const dto: UpdateUserDto = { name: 'New' };
      service.updateProfile.mockReturnValue('updated');

      expect(controller.updateMe(currentUser, dto)).toBe('updated');
      expect(service.updateProfile).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('updateMyPassword', () => {
    it('delegates to the service', async () => {
      const dto: UpdatePasswordDto = {
        currentPassword: 'old',
        newPassword: 'new',
      };
      service.updatePassword.mockResolvedValue(undefined);

      await controller.updateMyPassword(currentUser, dto);

      expect(service.updatePassword).toHaveBeenCalledWith(1, dto);
    });
  });
});

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PublicUserDto } from './dto/public-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('maps users to PublicUserDto and computes age', async () => {
      const users = [
        {
          id: 1,
          name: 'Анна',
          about: null,
          city: null,
          avatar: null,
          birthdate: null,
        },
        {
          id: 2,
          name: 'Иван',
          about: 'О себе',
          city: 'Москва',
          avatar: 'avatar.png',
          birthdate: '2000-01-01',
        },
      ];
      usersRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(usersRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(PublicUserDto);
      expect(result[0].age).toBeNull();
      expect(result[1].age).not.toBeNull();
      expect(result[1]).not.toHaveProperty('email');
      expect(result[1]).not.toHaveProperty('password');
    });
  });

  describe('findByEmail', () => {
    it('delegates to the repository', async () => {
      const user = { id: 1, email: 'a@b.c' };
      usersRepository.findOneBy.mockResolvedValue(user);

      await expect(service.findByEmail('a@b.c')).resolves.toEqual(user);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({
        email: 'a@b.c',
      });
    });
  });

  describe('findById', () => {
    it('delegates to the repository', async () => {
      const user = { id: 1 };
      usersRepository.findOneBy.mockResolvedValue(user);

      await expect(service.findById(1)).resolves.toEqual(user);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('create', () => {
    it('creates and saves a user', async () => {
      const data = { name: 'Анна', email: 'a@b.c', password: 'hashed' };
      usersRepository.create.mockReturnValue(data);
      usersRepository.save.mockResolvedValue(data);

      await expect(service.create(data)).resolves.toEqual(data);
      expect(usersRepository.create).toHaveBeenCalledWith(data);
      expect(usersRepository.save).toHaveBeenCalledWith(data);
    });
  });

  describe('updateProfile', () => {
    it('updates the user when found', async () => {
      const user = { id: 1, name: 'Old', email: 'a@b.c' };
      usersRepository.findOneBy.mockResolvedValue(user);
      usersRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      const dto: UpdateUserDto = { name: 'New' };
      await service.updateProfile(1, dto);

      expect(user.name).toBe('New');
    });

    it('throws NotFoundException when user does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.updateProfile(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when email is taken by another user', async () => {
      const user = { id: 1, email: 'a@b.c' };
      usersRepository.findOneBy
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ id: 2, email: 'new@b.c' });

      await expect(
        service.updateProfile(1, { email: 'new@b.c' }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows keeping the same email', async () => {
      const user = { id: 1, email: 'a@b.c' };
      usersRepository.findOneBy
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(user);
      usersRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      await service.updateProfile(1, { email: 'a@b.c' });

      expect(usersRepository.save).toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    it('hashes and stores the new password', async () => {
      const user = { id: 1, password: 'old-hash' };
      usersRepository.findOneBy.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      usersRepository.save.mockResolvedValue(user);

      const dto: UpdatePasswordDto = {
        currentPassword: 'old',
        newPassword: 'new',
      };
      await service.updatePassword(1, dto);

      expect(user.password).toBe('new-hash');
    });

    it('throws UnauthorizedException for a wrong current password', async () => {
      usersRepository.findOneBy.mockResolvedValue({
        id: 1,
        password: 'old-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.updatePassword(1, {
          currentPassword: 'wrong',
          newPassword: 'new',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException when new password equals current', async () => {
      usersRepository.findOneBy.mockResolvedValue({
        id: 1,
        password: 'old-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.updatePassword(1, {
          currentPassword: 'same',
          newPassword: 'same',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updatePassword(1, {
          currentPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRefreshToken', () => {
    it('updates the refresh token hash', async () => {
      usersRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateRefreshToken(1, 'hash');

      expect(usersRepository.update).toHaveBeenCalledWith(1, {
        refreshToken: 'hash',
      });
    });

    it('clears the refresh token when null is passed', async () => {
      usersRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateRefreshToken(1, null);

      expect(usersRepository.update).toHaveBeenCalledWith(1, {
        refreshToken: null,
      });
    });
  });
});

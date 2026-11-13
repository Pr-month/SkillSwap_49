import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { Request } from './entities/request.entity';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from '../auth/auth.types';

describe('RequestsService', () => {
  let service: RequestsService;
  let requestsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    requestsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(Request), useValue: requestsRepository },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  describe('findIncoming', () => {
    it('returns incoming requests with relations ordered by createdAt desc', async () => {
      const requests = [
        { id: 2, createdAt: new Date() },
        { id: 1, createdAt: new Date() },
      ];
      requestsRepository.find.mockResolvedValue(requests);

      const result = await service.findIncoming(10);

      expect(requestsRepository.find).toHaveBeenCalledWith({
        where: { receiver: { id: 10 } },
        relations: {
          sender: true,
          receiver: true,
          offeredSkill: true,
          requestedSkill: true,
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(requests);
    });
  });

  describe('remove', () => {
    const ownerPayload: JwtPayload = {
      sub: 10,
      email: 'owner@b.c',
      role: UserRole.USER,
    };

    it('deletes the request when the user is the sender', async () => {
      requestsRepository.findOne.mockResolvedValue({
        id: 1,
        sender: { id: 10 },
      });
      requestsRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, ownerPayload);

      expect(requestsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deletes the request when the user is an admin', async () => {
      const adminPayload: JwtPayload = {
        sub: 99,
        email: 'admin@b.c',
        role: UserRole.ADMIN,
      };
      requestsRepository.findOne.mockResolvedValue({
        id: 1,
        sender: { id: 10 },
      });
      requestsRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, adminPayload);

      expect(requestsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the request does not exist', async () => {
      requestsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, ownerPayload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for a non-owner non-admin user', async () => {
      requestsRepository.findOne.mockResolvedValue({
        id: 1,
        sender: { id: 2 },
      });

      await expect(service.remove(1, ownerPayload)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

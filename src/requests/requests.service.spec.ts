import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { Request } from './entities/request.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from '../auth/auth.types';
import { RequestStatus } from './request.enums';
import { NotificationsService } from '../notifications/notifications.service';

describe('RequestsService', () => {
  let service: RequestsService;
  let requestsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let usersRepository: { findOneBy: jest.Mock };
  let skillsRepository: {
    findOneBy: jest.Mock;
    findOne: jest.Mock;
  };
  let notificationsService: {
    notifyRequestReceived: jest.Mock;
    notifyRequestUpdated: jest.Mock;
  };

  beforeEach(async () => {
    requestsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    usersRepository = { findOneBy: jest.fn() };
    skillsRepository = { findOneBy: jest.fn(), findOne: jest.fn() };
    notificationsService = {
      notifyRequestReceived: jest.fn(),
      notifyRequestUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(Request), useValue: requestsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  describe('create', () => {
    const dto = { offeredSkillId: 1, requestedSkillId: 2 };

    it('creates a pending request and notifies the receiver', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 10, name: 'Sender' });
      skillsRepository.findOneBy.mockResolvedValue({ id: 1 });
      skillsRepository.findOne.mockResolvedValue({
        id: 2,
        owner: { id: 20 },
      });
      const saved = { id: 5, status: RequestStatus.PENDING };
      requestsRepository.create.mockReturnValue(saved);
      requestsRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto, 10);

      expect(requestsRepository.create).toHaveBeenCalledWith({
        sender: { id: 10, name: 'Sender' },
        receiver: { id: 20 },
        offeredSkill: { id: 1 },
        requestedSkill: { id: 2, owner: { id: 20 } },
        status: RequestStatus.PENDING,
      });
      expect(notificationsService.notifyRequestReceived).toHaveBeenCalledWith(
        20,
        'Sender',
        5,
      );
      expect(result).toEqual(saved);
    });

    it('throws NotFoundException when the offered skill is missing', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 10 });
      skillsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto, 10)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when sending a request to self', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 10 });
      skillsRepository.findOneBy.mockResolvedValue({ id: 1 });
      skillsRepository.findOne.mockResolvedValue({
        id: 2,
        owner: { id: 10 },
      });

      await expect(service.create(dto, 10)).rejects.toThrow(
        BadRequestException,
      );
    });
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

  describe('findOutgoing', () => {
    it('returns outgoing requests with relations ordered by createdAt desc', async () => {
      const requests = [{ id: 2, createdAt: new Date() }];
      requestsRepository.find.mockResolvedValue(requests);

      const result = await service.findOutgoing(10);

      expect(requestsRepository.find).toHaveBeenCalledWith({
        where: { sender: { id: 10 } },
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

  describe('update', () => {
    it('updates status for the receiver and notifies the sender', async () => {
      requestsRepository.findOne.mockResolvedValue({
        id: 5,
        sender: { id: 10 },
        receiver: { id: 20 },
      });
      const saved = { id: 5, status: RequestStatus.ACCEPT };
      requestsRepository.save.mockResolvedValue(saved);

      const result = await service.update(
        5,
        { status: RequestStatus.ACCEPT },
        20,
      );

      expect(requestsRepository.save).toHaveBeenCalledWith({
        id: 5,
        sender: { id: 10 },
        receiver: { id: 20 },
        status: RequestStatus.ACCEPT,
      });
      expect(notificationsService.notifyRequestUpdated).toHaveBeenCalledWith(
        10,
        5,
        RequestStatus.ACCEPT,
      );
      expect(result).toEqual(saved);
    });

    it('throws NotFoundException when the request does not exist', async () => {
      requestsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(5, { status: RequestStatus.ACCEPT }, 20),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for a non-receiver', async () => {
      requestsRepository.findOne.mockResolvedValue({
        id: 5,
        sender: { id: 10 },
        receiver: { id: 20 },
      });

      await expect(
        service.update(5, { status: RequestStatus.ACCEPT }, 99),
      ).rejects.toThrow(ForbiddenException);
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

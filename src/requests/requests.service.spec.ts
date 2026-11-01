import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateRequestDto } from './dto/create-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './requests.enums';
import { RequestsService } from './requests.service';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';

describe('RequestsService', () => {
  let service: RequestsService;

  const requestsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const skillsRepository = {
    findOne: jest.fn(),
  };

  const usersRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(Request), useValue: requestsRepository },
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  describe('create', () => {
    const dto: CreateRequestDto = {
      offeredSkillId: 1,
      requestedSkillId: 2,
    };

    it('creates a request with sender from auth and receiver from skill owner', async () => {
      const sender = { id: 5 };
      const offeredSkill = { id: 1, owner: { id: 5 } };
      const requestedSkill = { id: 2, owner: { id: 9 } };
      const created = { id: 1 };

      usersRepository.findOneBy.mockResolvedValue(sender);
      skillsRepository.findOne
        .mockResolvedValueOnce(offeredSkill)
        .mockResolvedValueOnce(requestedSkill);
      requestsRepository.create.mockReturnValue(created);
      requestsRepository.save.mockResolvedValue(created);

      const result = await service.create(dto, 5);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(skillsRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        relations: { owner: true },
      });
      expect(skillsRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        relations: { owner: true },
      });
      expect(requestsRepository.create).toHaveBeenCalledWith({
        sender,
        receiver: requestedSkill.owner,
        offeredSkill,
        requestedSkill,
        status: RequestStatus.PENDING,
        isRead: false,
      });
      expect(result).toBe(created);
    });

    it('throws 404 when sender is not found', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto, 5)).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when offered skill is not found', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 5 });
      skillsRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(dto, 5)).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when requested skill is not found', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 5 });
      skillsRepository.findOne
        .mockResolvedValueOnce({ id: 1, owner: { id: 5 } })
        .mockResolvedValueOnce(null);

      await expect(service.create(dto, 5)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOutgoing', () => {
    it('returns requests where user is the sender', async () => {
      const requests = [{ id: 1 }, { id: 2 }];
      requestsRepository.find.mockResolvedValue(requests);

      const result = await service.findOutgoing(5);

      expect(requestsRepository.find).toHaveBeenCalledWith({
        where: { sender: { id: 5 } },
        relations: {
          receiver: true,
          offeredSkill: { owner: true },
          requestedSkill: { owner: true },
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toBe(requests);
    });
  });
});

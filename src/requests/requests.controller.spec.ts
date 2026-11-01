import { Test, TestingModule } from '@nestjs/testing';

import { CreateRequestDto } from './dto/create-request.dto';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import type { JwtPayload } from '../auth/auth.types';
import { UserRole } from '../users/users.enums';

describe('RequestsController', () => {
  let controller: RequestsController;

  const requestsService = {
    create: jest.fn(),
    findOutgoing: jest.fn(),
  };

  const user: JwtPayload = {
    sub: 5,
    email: 'user@example.com',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: requestsService }],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('calls service.create with dto and current user id', async () => {
    const dto: CreateRequestDto = {
      offeredSkillId: 1,
      requestedSkillId: 2,
    };

    await controller.create(dto, user);

    expect(requestsService.create).toHaveBeenCalledWith(dto, user.sub);
  });

  it('calls service.findOutgoing with current user id', async () => {
    await controller.findOutgoing(user);

    expect(requestsService.findOutgoing).toHaveBeenCalledWith(user.sub);
  });
});

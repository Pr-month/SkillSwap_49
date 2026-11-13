import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from '../auth/auth.types';

describe('RequestsController', () => {
  let controller: RequestsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findIncoming: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const currentUser: JwtPayload = {
    sub: 10,
    email: 'a@b.c',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findIncoming: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: service }],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to the service', () => {
      const dto: CreateRequestDto = {};
      service.create.mockReturnValue('created');

      expect(controller.create(dto)).toBe('created');
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('delegates to the service', () => {
      service.findAll.mockReturnValue('all');

      expect(controller.findAll()).toBe('all');
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findIncoming', () => {
    it('delegates to the service with the current user id', () => {
      service.findIncoming.mockReturnValue([]);

      expect(controller.findIncoming(currentUser)).toEqual([]);
      expect(service.findIncoming).toHaveBeenCalledWith(10);
    });
  });

  describe('findOne', () => {
    it('delegates to the service', () => {
      service.findOne.mockReturnValue('request');

      expect(controller.findOne(3)).toBe('request');
      expect(service.findOne).toHaveBeenCalledWith(3);
    });
  });

  describe('update', () => {
    it('delegates to the service', () => {
      const dto: UpdateRequestDto = {};
      service.update.mockReturnValue('updated');

      expect(controller.update('3', dto)).toBe('updated');
      expect(service.update).toHaveBeenCalledWith(3, dto);
    });
  });

  describe('remove', () => {
    it('delegates to the service with a numeric id and the user', () => {
      service.remove.mockReturnValue('removed');

      expect(controller.remove('3', currentUser)).toBe('removed');
      expect(service.remove).toHaveBeenCalledWith(3, currentUser);
    });
  });
});

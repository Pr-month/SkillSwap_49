import { Test, TestingModule } from '@nestjs/testing';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from '../auth/auth.types';

describe('SkillsController', () => {
  let controller: SkillsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    addFavorite: jest.Mock;
    removeFavorite: jest.Mock;
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
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addFavorite: jest.fn(),
      removeFavorite: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [{ provide: SkillsService, useValue: service }],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to the service with the owner id', () => {
      const dto: CreateSkillDto = {
        title: 'React',
        description: 'Framework',
        categoryId: 1,
      };
      service.create.mockReturnValue('created');

      expect(controller.create(dto, currentUser)).toBe('created');
      expect(service.create).toHaveBeenCalledWith(dto, 10);
    });
  });

  describe('findAll', () => {
    it('delegates to the service', () => {
      service.findAll.mockReturnValue('all');

      expect(controller.findAll()).toBe('all');
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('delegates to the service', () => {
      service.findOne.mockReturnValue('skill');

      expect(controller.findOne(3)).toBe('skill');
      expect(service.findOne).toHaveBeenCalledWith(3);
    });
  });

  describe('update', () => {
    it('delegates to the service with the owner id', () => {
      const dto: UpdateSkillDto = { title: 'New' };
      service.update.mockReturnValue('updated');

      expect(controller.update(3, dto, currentUser)).toBe('updated');
      expect(service.update).toHaveBeenCalledWith(3, dto, 10);
    });
  });

  describe('remove', () => {
    it('delegates to the service with the owner id', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(3, currentUser);

      expect(service.remove).toHaveBeenCalledWith(3, 10);
    });
  });

  describe('addFavorite', () => {
    it('delegates to the service with the skill id and owner id', () => {
      service.addFavorite.mockReturnValue({ message: 'ok' });

      expect(controller.addFavorite(3, currentUser)).toEqual({
        message: 'ok',
      });
      expect(service.addFavorite).toHaveBeenCalledWith(3, 10);
    });
  });

  describe('removeFavorite', () => {
    it('delegates to the service with the skill id and owner id', () => {
      service.removeFavorite.mockReturnValue({ message: 'ok' });

      expect(controller.removeFavorite(3, currentUser)).toEqual({
        message: 'ok',
      });
      expect(service.removeFavorite).toHaveBeenCalledWith(3, 10);
    });
  });
});

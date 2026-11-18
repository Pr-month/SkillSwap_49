import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: service }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to the service', () => {
      const dto: CreateCategoryDto = { name: 'IT' };
      service.create.mockReturnValue('created');

      expect(controller.create(dto)).toBe('created');
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('delegates to the service', () => {
      service.findAll.mockReturnValue([]);

      expect(controller.findAll()).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('delegates to the service with a numeric id', () => {
      service.findOne.mockReturnValue('category');

      expect(controller.findOne('3')).toBe('category');
      expect(service.findOne).toHaveBeenCalledWith(3);
    });
  });

  describe('update', () => {
    it('delegates to the service', () => {
      const dto: UpdateCategoryDto = { name: 'New' };
      service.update.mockReturnValue('updated');

      expect(controller.update(3, dto)).toBe('updated');
      expect(service.update).toHaveBeenCalledWith(3, dto);
    });
  });

  describe('remove', () => {
    it('delegates to the service with a numeric id', () => {
      service.remove.mockReturnValue('removed');

      expect(controller.remove('3')).toBe('removed');
      expect(service.remove).toHaveBeenCalledWith(3);
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, IsNull } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    delete: jest.Mock;
    manager: { transaction: jest.Mock };
  };

  beforeEach(async () => {
    categoriesRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      delete: jest.fn(),
      manager: { transaction: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('creates a root category when parentId is not provided', async () => {
      const saved = { id: 1, name: 'IT и программирование', parent: null };
      categoriesRepository.create.mockReturnValue(saved);
      categoriesRepository.save.mockResolvedValue(saved);

      const dto: CreateCategoryDto = { name: '  IT и программирование  ' };
      const result = await service.create(dto);

      expect(categoriesRepository.create).toHaveBeenCalledWith({
        name: 'IT и программирование',
        parent: null,
      });
      expect(result).toEqual(saved);
    });

    it('throws BadRequestException for a name shorter than 3 characters', async () => {
      await expect(service.create({ name: 'ab' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates a child category when parent exists and is a root', async () => {
      const parent = { id: 5, name: 'IT', parent: null };
      const saved = { id: 6, name: 'Frontend', parent };
      categoriesRepository.findOne.mockResolvedValue(parent);
      categoriesRepository.create.mockReturnValue(saved);
      categoriesRepository.save.mockResolvedValue(saved);

      const result = await service.create({ name: 'Frontend', parentId: 5 });

      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: { parent: true },
      });
      expect(result).toEqual(saved);
    });

    it('throws NotFoundException when parent does not exist', async () => {
      categoriesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Frontend', parentId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when parent is itself a subcategory', async () => {
      categoriesRepository.findOne.mockResolvedValue({
        id: 5,
        parent: { id: 1 },
      });

      await expect(
        service.create({ name: 'Frontend', parentId: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns only root categories with their children ordered by id', async () => {
      const roots = [
        { id: 1, name: 'IT', children: [{ id: 2, name: 'Frontend' }] },
      ];
      categoriesRepository.find.mockResolvedValue(roots);

      const result = await service.findAll();

      expect(categoriesRepository.find).toHaveBeenCalledWith({
        where: { parent: IsNull() },
        relations: { children: true },
        order: { id: 'ASC', children: { id: 'ASC' } },
      });
      expect(result).toEqual(roots);
    });
  });

  describe('update', () => {
    it('throws NotFoundException if category does not exist', async () => {
      categoriesRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, {})).rejects.toThrow(NotFoundException);
    });

    it('updates and trims the name', async () => {
      const category = { id: 1, name: 'Old', parent: null };
      categoriesRepository.findOne.mockResolvedValue(category);
      categoriesRepository.save.mockImplementation((c: Category) =>
        Promise.resolve(c),
      );

      const dto: UpdateCategoryDto = { name: '  New Name  ' };
      const result = await service.update(1, dto);

      expect(category.name).toBe('New Name');
      expect(categoriesRepository.save).toHaveBeenCalledWith(category);
      expect(result).toEqual(category);
    });

    it('throws BadRequestException for a too short name', async () => {
      const category = { id: 1, name: 'Old', parent: null };
      categoriesRepository.findOne.mockResolvedValue(category);

      await expect(service.update(1, { name: 'ab' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('sets parent to null when parentId is null', async () => {
      const category = { id: 2, name: 'Frontend', parent: { id: 1 } };
      categoriesRepository.findOne.mockResolvedValue(category);
      categoriesRepository.save.mockImplementation((c: Category) =>
        Promise.resolve(c),
      );

      await service.update(2, { parentId: null });

      expect(category.parent).toBeNull();
    });

    it('throws BadRequestException when making a category its own parent', async () => {
      const category = { id: 1, name: 'IT', parent: null };
      categoriesRepository.findOne.mockResolvedValue(category);

      await expect(service.update(1, { parentId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when the new parent does not exist', async () => {
      const category = { id: 2, name: 'Frontend', parent: null };
      categoriesRepository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(null);

      await expect(service.update(2, { parentId: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the new parent is a subcategory', async () => {
      const category = { id: 2, name: 'Frontend', parent: null };
      categoriesRepository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce({ id: 99, parent: { id: 1 } });

      await expect(service.update(2, { parentId: 99 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when the category has children', async () => {
      const category = { id: 1, name: 'IT', parent: null };
      categoriesRepository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce({ id: 99, parent: null });
      categoriesRepository.findOneBy.mockResolvedValue({ id: 3 });

      await expect(service.update(1, { parentId: 99 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('assigns a new parent', async () => {
      const category = { id: 2, name: 'Frontend', parent: null };
      const newParent = { id: 99, parent: null };
      categoriesRepository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(newParent);
      categoriesRepository.findOneBy.mockResolvedValue(null);
      categoriesRepository.save.mockImplementation((c: Category) =>
        Promise.resolve(c),
      );

      await service.update(2, { parentId: 99 });

      expect(category.parent).toEqual(newParent);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException if category does not exist', async () => {
      categoriesRepository.manager.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<unknown>) => {
          const manager = {
            getRepository: jest.fn((entity: unknown) =>
              entity === Category
                ? { findOneBy: jest.fn().mockResolvedValue(null) }
                : {},
            ),
          };

          return cb(manager);
        },
      );

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('removes the category with its children and detaches linked skills', async () => {
      const category = { id: 1, name: 'IT' };
      const children = [{ id: 2 }, { id: 3 }];
      const linkedSkills = [{ id: 10 }, { id: 11 }];

      const categoriesManagerRepo = {
        findOneBy: jest.fn().mockResolvedValue(category),
        find: jest.fn().mockResolvedValue(children),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      const skillsManagerRepo = {
        find: jest.fn().mockResolvedValue(linkedSkills),
        update: jest.fn().mockResolvedValue({ affected: 2 }),
      };
      const deleteBuilder = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      categoriesRepository.manager.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<unknown>) => {
          const manager = {
            getRepository: jest.fn((entity: unknown) =>
              entity === Category ? categoriesManagerRepo : skillsManagerRepo,
            ),
            createQueryBuilder: jest.fn().mockReturnValue({
              delete: jest.fn().mockReturnValue(deleteBuilder),
            }),
          };

          return cb(manager);
        },
      );

      const result = await service.remove(1);

      expect(result).toEqual({
        message:
          'Категория и её подкатегории удалены, связанные навыки сохранены без категории',
        deletedCategoryIds: [1, 2, 3],
        updatedSkillIds: [10, 11],
      });
      expect(skillsManagerRepo.update).toHaveBeenCalledWith(
        { id: In([10, 11]) },
        { category: null },
      );
      expect(categoriesManagerRepo.delete).toHaveBeenCalledWith([2, 3]);
      expect(categoriesManagerRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});

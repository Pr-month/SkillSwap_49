import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

describe('SkillsService', () => {
  let service: SkillsService;
  let skillsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let categoriesRepository: { findOneBy: jest.Mock };
  let usersRepository: { findOneBy: jest.Mock };

  beforeEach(async () => {
    skillsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    categoriesRepository = { findOneBy: jest.fn() };
    usersRepository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  describe('create', () => {
    const dto: CreateSkillDto = {
      title: '  React  ',
      description: '  Frontend framework  ',
      categoryId: 1,
      images: ['a.png'],
    };

    it('creates a skill', async () => {
      const owner = { id: 10 };
      const category = { id: 1 };
      usersRepository.findOneBy.mockResolvedValue(owner);
      categoriesRepository.findOneBy.mockResolvedValue(category);
      const saved = { id: 1, title: 'React', owner, category };
      skillsRepository.create.mockReturnValue(saved);
      skillsRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto, 10);

      expect(skillsRepository.create).toHaveBeenCalledWith({
        title: 'React',
        description: 'Frontend framework',
        images: ['a.png'],
        owner,
        category,
      });
      expect(result).toEqual(saved);
    });

    it('throws BadRequestException for an empty title', async () => {
      await expect(
        service.create({ ...dto, title: '   ' }, 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the owner does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto, 10)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the category does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 10 });
      categoriesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws BadRequestException for an invalid id', async () => {
      await expect(service.update(0, {}, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when the skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, {}, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the user is not the owner', async () => {
      skillsRepository.findOne.mockResolvedValue({ id: 1, owner: { id: 2 } });

      await expect(service.update(1, {}, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('updates the skill fields', async () => {
      const skill = {
        id: 1,
        title: 'Old',
        description: 'Old desc',
        owner: { id: 10 },
      };
      skillsRepository.findOne.mockResolvedValue(skill);
      skillsRepository.save.mockImplementation((s: Skill) =>
        Promise.resolve(s),
      );

      const dto: UpdateSkillDto = { title: 'New', description: 'Desc' };
      await service.update(1, dto, 10);

      expect(skill.title).toBe('New');
      expect(skill.description).toBe('Desc');
    });

    it('throws NotFoundException when the new category does not exist', async () => {
      const skill = { id: 1, owner: { id: 10 } };
      skillsRepository.findOne.mockResolvedValue(skill);
      categoriesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(1, { categoryId: 99 }, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates the category', async () => {
      const skill = { id: 1, owner: { id: 10 }, category: null };
      const category = { id: 2 };
      skillsRepository.findOne.mockResolvedValue(skill);
      categoriesRepository.findOneBy.mockResolvedValue(category);
      skillsRepository.save.mockImplementation((s: Skill) =>
        Promise.resolve(s),
      );

      await service.update(1, { categoryId: 2 }, 10);

      expect(skill.category).toEqual(category);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 10)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the user is not the owner', async () => {
      skillsRepository.findOne.mockResolvedValue({ id: 1, owner: { id: 2 } });

      await expect(service.remove(1, 10)).rejects.toThrow(ForbiddenException);
    });

    it('removes the skill for its owner', async () => {
      const skill = { id: 1, owner: { id: 10 } };
      skillsRepository.findOne.mockResolvedValue(skill);
      skillsRepository.remove.mockResolvedValue(skill);

      await service.remove(1, 10);

      expect(skillsRepository.remove).toHaveBeenCalledWith(skill);
    });
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';

describe('SkillsService', () => {
  let service: SkillsService;

  const skillsRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const categoriesRepository = {
    findOneBy: jest.fn(),
  };

  const usersRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

  describe('addToFavorites', () => {
    it('adds a skill to user favorites', async () => {
      const user = { id: 1, favoriteSkills: [] as Array<{ id: number }> };
      const skill = { id: 10 };

      usersRepository.findOne.mockResolvedValue(user);
      skillsRepository.findOneBy.mockResolvedValue(skill);
      usersRepository.save.mockResolvedValue(user);

      await service.addToFavorites(10, 1);

      expect(user.favoriteSkills).toContain(skill);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });

    it('throws 404 when user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.addToFavorites(10, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 when skill is not found', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        favoriteSkills: [],
      });
      skillsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.addToFavorites(10, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 409 when skill is already in favorites', async () => {
      const user = { id: 1, favoriteSkills: [{ id: 10 }] };

      usersRepository.findOne.mockResolvedValue(user);
      skillsRepository.findOneBy.mockResolvedValue({ id: 10 });

      await expect(service.addToFavorites(10, 1)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeFromFavorites', () => {
    it('removes a skill from user favorites', async () => {
      const user = { id: 1, favoriteSkills: [{ id: 10 }] };

      usersRepository.findOne.mockResolvedValue(user);
      skillsRepository.findOneBy.mockResolvedValue({ id: 10 });
      usersRepository.save.mockResolvedValue(user);

      await service.removeFromFavorites(10, 1);

      expect(user.favoriteSkills).toHaveLength(0);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });

    it('throws 404 when user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromFavorites(10, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 when skill is not found', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        favoriteSkills: [],
      });
      skillsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.removeFromFavorites(10, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 when skill is not in favorites', async () => {
      const user = { id: 1, favoriteSkills: [] as Array<{ id: number }> };

      usersRepository.findOne.mockResolvedValue(user);
      skillsRepository.findOneBy.mockResolvedValue({ id: 10 });

      await expect(service.removeFromFavorites(10, 1)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });
});

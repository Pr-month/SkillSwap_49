import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,

    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    createSkillDto: CreateSkillDto,
    ownerId: number,
  ): Promise<Skill> {
    const title = createSkillDto.title.trim();
    const description = createSkillDto.description.trim();

    if (!title || !description) {
      throw new BadRequestException(
        'Название и описание навыка не должны быть пустыми',
      );
    }

    const owner = await this.usersRepository.findOneBy({
      id: ownerId,
    });

    if (!owner) {
      throw new NotFoundException('Пользователь не найден');
    }

    const category = await this.categoriesRepository.findOneBy({
      id: createSkillDto.categoryId,
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    const skill = this.skillsRepository.create({
      title,
      description,
      images: createSkillDto.images ?? [],
      owner,
      category,
    });

    return this.skillsRepository.save(skill);
  }

  findAll() {
    return `This action returns all skills`;
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  update(id: number, updateSkillDto: UpdateSkillDto) {
    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}

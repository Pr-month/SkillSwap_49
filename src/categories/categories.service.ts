import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const name = createCategoryDto.name?.trim();

    if (!name || name.length < 3 || name.length > 255) {
      throw new BadRequestException(
        'Название категории должно содержать от 3 до 255 символов',
      );
    }

    let parent: Category | null = null;

    if (createCategoryDto.parentId != null) {
      parent = await this.categoriesRepository.findOne({
        where: { id: createCategoryDto.parentId },
        relations: { parent: true },
      });

      if (!parent) {
        throw new NotFoundException('Родительская категория не найдена');
      }

      if (parent.parent !== null) {
        throw new BadRequestException(
          'Подкатегория не может быть родительской категорией',
        );
      }
    }

    const category = this.categoriesRepository.create({
      name,
      parent,
    });

    return this.categoriesRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: {
        parent: IsNull(),
      },
      relations: {
        children: true,
      },
      order: {
        id: 'ASC',
        children: {
          id: 'ASC',
        },
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: {
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    const { name, parentId } = updateCategoryDto;

    if (name !== undefined) {
      if (
        typeof name !== 'string' ||
        name.trim().length < 3 ||
        name.trim().length > 255
      ) {
        throw new BadRequestException(
          'Название категории должно содержать от 3 до 255 символов',
        );
      }

      category.name = name.trim();
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        category.parent = null;
      } else {
        if (parentId === category.id) {
          throw new BadRequestException(
            'Категория не может быть родителем самой себе',
          );
        }

        const parent = await this.categoriesRepository.findOne({
          where: {
            id: parentId,
          },
          relations: {
            parent: true,
          },
        });

        if (!parent) {
          throw new NotFoundException('Родительская категория не найдена');
        }

        if (parent.parent !== null) {
          throw new BadRequestException(
            'Подкатегория не может быть родительской категорией',
          );
        }

        const child = await this.categoriesRepository.findOneBy({
          parent: {
            id: category.id,
          },
        });

        if (child) {
          throw new BadRequestException(
            'Категорию с подкатегориями нельзя сделать подкатегорией',
          );
        }

        category.parent = parent;
      }
    }

    return this.categoriesRepository.save(category);
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}

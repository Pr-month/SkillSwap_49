import { ConfigModule } from '@nestjs/config';
import { IsNull, Not } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { seedSkills } from './data/seed-skills.data';

async function seedSkillsData(): Promise<void> {
  await ConfigModule.forRoot({
    envFilePath: '.env',
  });

  const { AppDataSource } = await import('../config/database.config');

  AppDataSource.setOptions({ logging: false });

  try {
    await AppDataSource.initialize();

    await AppDataSource.transaction(async (manager) => {
      const usersRepo = manager.getRepository(User);
      const categoriesRepo = manager.getRepository(Category);
      const skillsRepo = manager.getRepository(Skill);

      let createdCount = 0;
      let skippedCount = 0;

      for (const skillData of seedSkills) {
        const owner = await usersRepo.findOneBy({
          email: skillData.ownerEmail,
        });

        if (!owner) {
          throw new Error(
            `Не найден пользователь ${skillData.ownerEmail}. Сначала выполните сидинг пользователей`,
          );
        }

        const categories = await categoriesRepo.find({
          where: {
            name: skillData.categoryName,
            parent: { id: Not(IsNull()) },
          },
        });

        if (categories.length === 0) {
          throw new Error(
            `Подкатегория "${skillData.categoryName}" не найдена. Сначала выполните сидинг категорий`,
          );
        }

        if (categories.length > 1) {
          throw new Error(
            `Найдено несколько подкатегорий с названием "${skillData.categoryName}". Невозможно однозначно выбрать категорию для навыка`,
          );
        }

        const category = categories[0];

        const existingSkill = await skillsRepo.findOne({
          where: {
            title: skillData.title,
            owner: { id: owner.id },
          },
        });

        if (existingSkill) {
          skippedCount++;
          continue;
        }

        const skill = skillsRepo.create({
          title: skillData.title,
          description: skillData.description,
          images: skillData.images,
          owner,
          category,
        });

        await skillsRepo.save(skill);
        createdCount++;
      }

      return { createdCount, skippedCount };
    }).then(({ createdCount, skippedCount }) => {
      console.log(
        `Сидинг навыков завершён. Создано: ${createdCount}, пропущено: ${skippedCount}`,
      );
    });
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedSkillsData().catch((error: unknown) => {
  console.error('Ошибка сидирования навыков:', error);
  process.exitCode = 1;
});

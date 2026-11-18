import 'dotenv/config';
import { Category } from '../categories/entities/category.entity';
import { createSeedDataSource } from '../config/database.config';
import { CategoriesData } from './data/seed-categories.data';

async function seedCategories(): Promise<void> {
  const dataSource = createSeedDataSource();

  try {
    await dataSource.initialize();

    const categoriesRepo = dataSource.getRepository(Category);
    const categoriesCount = await categoriesRepo.count();

    if (categoriesCount > 0) {
      console.log('Пропущен сидинг категорий: таблица уже содержит данные');
      return;
    }

    let createdParentsCount = 0;
    let createdChildrenCount = 0;

    for (const category of CategoriesData) {
      const newCategory = categoriesRepo.create({
        name: category.name,
        parent: null,
      });

      const savedCategory = await categoriesRepo.save(newCategory);
      createdParentsCount++;

      for (const childName of category.children) {
        const childCategory = categoriesRepo.create({
          name: childName,
          parent: savedCategory,
        });

        await categoriesRepo.save(childCategory);
        createdChildrenCount++;
      }
    }

    console.log(
      `Сидинг категорий завершён. Создано категорий: ${createdParentsCount}, ` +
        `подкатегорий: ${createdChildrenCount}`,
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedCategories().catch((error) => {
  console.error('Ошибка сидирования категорий:', error);
});

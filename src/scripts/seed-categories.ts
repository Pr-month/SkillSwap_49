import { Category } from '../categories/entities/category.entity';
import { AppDataSource } from '../config/database.config';
import { CategoriesData } from './data/seed-categories.data';

async function seedCategories(): Promise<void> {
  AppDataSource.setOptions({ logging: false });

  try {
    await AppDataSource.initialize();

    const categoriesRepo = AppDataSource.getRepository(Category);
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
      `Сидинг завершён. Создано категорий: ${createdParentsCount}, ` +
        `подкатегорий: ${createdChildrenCount}`,
    );
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedCategories().catch((error) => {
  console.error('Ошибка сидирования категорий:', error);
});

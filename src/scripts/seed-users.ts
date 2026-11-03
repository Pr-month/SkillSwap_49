import { hash } from 'bcryptjs';
import { appConfig } from '../config/app.config';
import { AppDataSource } from '../config/database.config';
import { seedUsers } from './data/seed-users.data';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/users.enums';

async function seedUsersData(): Promise<void> {
  AppDataSource.setOptions({ logging: false });

  try {
    await AppDataSource.initialize();

    const usersRepo = AppDataSource.getRepository(User);
    const config = appConfig();

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of seedUsers) {
      const existingUser = await usersRepo.findOneBy({
        email: userData.email,
      });

      if (existingUser) {
        console.log(
          `Пропущен: ${userData.email} — пользователь уже существует`,
        );

        skippedCount++;
        continue;
      }

      const passwordHash = await hash(userData.password, config.hashSalt);

      const user = usersRepo.create({
        name: userData.name,
        email: userData.email,
        password: passwordHash,
        role: UserRole.USER,
      });

      await usersRepo.save(user);

      console.log(`Создан пользователь: ${userData.email}`);
      createdCount++;
    }

    console.log(
      `Сидинг завершён. Создано: ${createdCount}, пропущено: ${skippedCount}`,
    );
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedUsersData().catch((error) => {
  console.error('Ошибка сидирования пользователей:', error);
});

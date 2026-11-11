import { ConfigModule } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { appConfig } from '../config/app.config';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/users.enums';

async function seedAdmin(): Promise<void> {
  await ConfigModule.forRoot({
    envFilePath: '.env',
  });

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Для сидирования администратора укажите ADMIN_EMAIL и ADMIN_PASSWORD в .env',
    );
  }

  const { AppDataSource } = await import('../config/database.config');

  AppDataSource.setOptions({ logging: false });

  try {
    await AppDataSource.initialize();

    const usersRepo = AppDataSource.getRepository(User);
    const existingUser = await usersRepo.findOneBy({ email });

    if (existingUser) {
      if (existingUser.role !== UserRole.ADMIN) {
        throw new Error(
          'ADMIN_EMAIL занят обычным пользователем. Укажите другой email',
        );
      }

      console.log('Администратор уже существует. Создание пропущено');
      return;
    }

    const passwordHash = await hash(password, appConfig().hashSalt);

    const admin = usersRepo.create({
      name: 'Администратор',
      email,
      password: passwordHash,
      role: UserRole.ADMIN,
    });

    await usersRepo.save(admin);

    console.log('Сидинг администратора завершён. Администратор создан');
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedAdmin().catch((error: unknown) => {
  console.error('Ошибка сидирования администратора:', error);
  process.exitCode = 1;
});

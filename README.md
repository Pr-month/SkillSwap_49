# Добро пожаловать в проект SkillSwapAPI

## Документация
[Техническое задание](https://docs.google.com/document/d/1d4o9Sb9o6lxXuqdEgKe4eRlH2s7gKrh0icJ3gyv2FD4/edit?tab=t.0#heading=h.ynonjn54b672) <br>
[Макет](https://www.figma.com/design/bKwOakHJI7Z2mh2zVCBphP/SkillSwap---Для-разработчиков?node-id=0-1&p=f&t=HH7S4bYwVVtxLM6z-0)

## Основные ветки

- `main` — стабильная, протестированная версия приложения (MVP). Прямой пуш запрещён. Мерж осуществляется только после прохождения всех тестов.
- `dev` — общая ветка разработки. Содержит актуальные изменения и обновляется по завершению недельных итераций.

---

## Недельный процесс разработки

Каждая неделя работы оформляется отдельной веткой `weekN`, которая создаётся от `dev`. Эта ветка включает:

- все инфраструктурные изменения (например, настройку базы данных, логгера, .env),
- pull request'ы студентов за текущую неделю.

### Шаги:

#### 1. Создание ветки недели (выполняется наставником)

```bash
git checkout dev
git pull origin dev
git checkout -b week1
git push origin week1
```

В эту ветку добавляются инфраструктурные изменения. Они могут быть оформлены через отдельный PR или пушем напрямую.

#### 2. Работа студентов

Каждый студент создаёт персональную ветку от `week1`:

```bash
git checkout week1
git pull origin week1
git checkout -b week1-username
git push origin week1-username
```

Работа выполняется в этой ветке.

#### 3. Отправка на проверку

В конце недели создаётся pull request из `week1-username` в `week1`.

После прохождения линтера и ревью изменения мержатся в `week1`.

#### 4. Финальный мерж недели

После завершения всех PR в `week1`, наставник мержит `week1` в `dev`:

```bash
git checkout dev
git pull origin dev
git merge week1
git push origin dev
```

---

## Политика веток и CI

- Прямой пуш в `main` и `dev` запрещён.
- Все изменения происходят через pull request'ы.
- Ветка `main` запускает полный набор проверок:
  - `lint`
  - `unit тесты`
  - `e2e тесты`
- В остальных ветках запускается только `lint`.

---

## CI-проверки

- Для PR в `main` — полный набор тестов.
- Для всех остальных веток — только линтер (`npm run lint`).

---

## Тестирование

### Unit-тесты

Запускаются без базы данных:

```bash
npm run test
```

### E2E-тесты

E2E-тесты поднимают приложение и работают с настоящей базой данных PostgreSQL
(`synchronize` включён, перед тестами таблицы очищаются через `TRUNCATE`), поэтому
используйте отдельную тестовую базу, а не рабочую.

Перед запуском задайте переменные окружения:

```bash
# либо строка подключения (как в CI)
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
# либо отдельные параметры
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_DATABASE=skillswap_test
```

Затем выполните:

```bash
npm run test:e2e
```

Файлы-фикстуры для тестов загрузки файлов лежат в `test/fixtures`.

---

## Настройка окружения

Перед запуском приложение проверяет переменные окружения и падает с понятной
ошибкой, если они невалидны (см. `src/config/env.validation.ts`). Проверяются:

- **JWT-секреты** — обязательны, не должны быть заглушками (`secret`, `changeme`
  и т.п.). В `production` секреты должны быть разными и длиной не менее 32 символов.
- **Параметры БД** — порт должен быть числом, в `production` запрещён
  `DB_SYNCHRONIZE=true` и обязательны параметры подключения (или `DATABASE_URL`).
- **Порт приложения и `HASH_SALT`** — должны быть корректными числами.

Скопируйте `.env.example` в `.env` и замените значения-заглушки на реальные.
Пример безопасных настроек описан в комментариях `.env.example`.

---

## Миграции базы данных

Схема БД управляется миграциями TypeORM. При `DB_SYNCHRONIZE=false` (всегда в
`production`) миграции выполняются автоматически **до старта приложения**
(`migrationsRun`). В разработке и тестах можно оставить `DB_SYNCHRONIZE=true`.

Команды (используют `src/data-source.ts`, который читает `.env`):

```bash
# Создать пустую миграцию (написать изменения вручную)
npm run migration:create -- src/migrations/NameOfMigration

# Сгенерировать миграцию по разнице между сущностями и БД
npm run migration:generate -- src/migrations/NameOfMigration

# Применить миграции
npm run migration:run

# Откатить последнюю миграцию
npm run migration:revert

# Показать статус миграций
npm run migration:show
```

### Порядок применения и отката

1. Внесите изменения в сущности (`src/**/entities/*.entity.ts`).
2. Сгенерируйте миграцию: `npm run migration:generate -- src/migrations/...`.
3. Проверьте сгенерированный SQL, при необходимости поправьте вручную.
4. Примените на пустой/локальной БД: `npm run migration:run`.
5. Откат изменений: `npm run migration:revert` (по одной миграции за вызов).

Первая миграция `src/migrations/1763080000000-InitialSchema.ts` создаёт все
текущие таблицы (`users`, `categories`, `skills`, `user_want_to_learn`,
`requests`, `skill_favorites`, `notifications`).

---

## Ограничение частоты запросов (rate limiting)

Все маршруты ограничены через `@nestjs/throttler`, а `auth/register`,
`auth/login` и `auth/refresh` дополнительно защищены более строгим лимитером
(`src/common/guards/auth-throttler.guard.ts`). При превышении возвращается
`429 Too Many Requests`.

Настройки через переменные окружения (см. `.env.example`):

- `THROTTLE_TTL` / `THROTTLE_LIMIT` — общий лимит (по умолчанию 100 запросов / 60 сек).
- `AUTH_THROTTLE_TTL` / `AUTH_THROTTLE_LIMIT` — строгий лимит для auth (по умолчанию 5 / 60 сек).
- `TRUST_PROXY=true` — учитывать реальный IP клиента из `X-Forwarded-For`,
  когда приложение развёрнуто за прокси (nginx и т.п.).

---

## Уведомления в реальном времени (WebSocket)

Уведомления генерируются при создании заявки (получателю) и изменении её
статуса (отправителю) и доставляются по WebSocket в namespace `/notifications`,
а также сохраняются в БД (`notifications`).

Подключение клиента:

```js
const socket = io('/notifications', { auth: { token: accessToken } });
socket.on('notification', (data) => { /* { id, type, message, isRead, ... } */ });
```

REST-эндпоинты (требуют авторизации):

- `GET /notifications` — список уведомлений текущего пользователя.
- `PATCH /notifications/:id/read` — отметить уведомление прочитанным.

---

## Обновление локальных веток

После мержей студенты обновляют свои ветки при необходимости:

```bash
git checkout week1-username
git pull origin week1
```

---

## Пример именования веток

- Ветка недели: `week1`
- Ветка студента: `week1-johndoe`

---

## Проверка заданий

- Ревью проводится по pull request'ам в ветку `weekN`.
- Итоговый merge недели осуществляется наставником в ветку `dev`.

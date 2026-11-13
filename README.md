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

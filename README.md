# Рецепты — Backend API

Этапы 1–2: каркас NestJS, схема PostgreSQL, health и вход администратора по JWT. Доступны `GET /api/v1/health` и `POST /api/v1/auth/login`. Маршруты рецептов появятся на этапе 3; их контракт описан в `docs/specs/backend-api.md`.

## Требования

- Node.js 24.18.0 (`.nvmrc`) и npm.
- Docker с Docker Compose.

## Локальный запуск

```sh
npm ci
cp .env.example .env
# Заполните JWT_SECRET в .env, например результатом: openssl rand -hex 32
docker compose up -d --wait
npm run db:generate
npm run db:migrate
npm run dev
```

Пример `.env` подключается к контейнеру на `localhost:5433`. При смене порта или реквизитов PostgreSQL обновите `DATABASE_URL` и настройки Compose согласованно. `.env` исключён из Git. Для запуска API обязателен `JWT_SECRET` длиной не менее 32 байт; встроенного секрета нет. `NODE_ENV` принимает `development`, `test` или `production`; `PORT` — число от 1 до 65535. `DATABASE_URL` обязателен. При ошибке обязательной конфигурации приложение завершает запуск с сообщением без вывода значений секретов.

`JWT_EXPIRES_IN` задаётся положительным числом секунд (`86400`) или длительностью с суффиксом `s`, `m`, `h`, `d` (`15m`, `1d`). По умолчанию `1d` = 86400 секунд; максимум 365 дней. После истечения JWT требуется повторный вход.

CORS выключен по умолчанию. Для браузерного клиента можно задать `CORS_ORIGINS` как список точных HTTP(S) origin через запятую, например `https://app.example.com,https://preview.example.com`. Нативному iOS-клиенту CORS не нужен.

## Сборка и запуск сборки

```sh
npm run typecheck
npm run build
npm run start
```

Prisma Client генерируется отдельной командой после установки зависимостей. Схема меняется через миграции в `prisma/migrations/`, без `db push`. `npm run db:migrate` применяет сохранённые миграции; для новой миграции на отдельной базе разработки используйте `npx prisma migrate dev --name <имя>`.

## Ручная проверка этапа 1

При запущенных приложении и базе:

```sh
curl -i http://localhost:3000/api/v1/health
curl -I http://localhost:3000/api/docs
docker compose exec -T postgres psql -U plate -d plate -c '\dt'
```

Health должен вернуть `200` и `{"status":"ok"}`; Swagger UI доступен по `http://localhost:3000/api/docs`. В базе должны быть `Recipe`, `User` и служебная таблица Prisma.

Для проверки отказа базы в локальной среде временно остановите контейнер и повторите запрос health: ожидается `503`. Затем верните базу:

```sh
docker compose stop postgres
curl -i http://localhost:3000/api/v1/health
docker compose up -d --wait
```

Compose использует постоянный volume `postgres_data`. `docker compose down` останавливает контейнер без удаления volume.

## Администратор и вход

Задайте `ADMIN_EMAIL` и `ADMIN_PASSWORD` в локальном `.env`, затем выполните:

```sh
npm run db:seed-admin
```

Команда нормализует email (trim и lowercase), проверяет его формат, требует пароль длиной от 12 символов до 72 UTF-8 байт и сохраняет только bcrypt-хеш с отдельной солью и cost factor 12. Seed не запускается при старте API. Повторный запуск не меняет пароль и роль существующей записи. Настройки администратора не нужны для обычного запуска API после создания учётной записи.

Пример входа после seed:

```sh
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"<пароль из ADMIN_PASSWORD>"}'
```

Подставьте настроенные данные. Ответ 200 содержит `accessToken`, `tokenType: "Bearer"`, `expiresIn` в секундах и `user` с `id`, `email`, `role`. Для будущих защищённых операций передавайте `Authorization: Bearer <accessToken>`. Токен подписан HS256, содержит `sub`, `iat`, `exp`; на защищённом запросе пользователь и текущая роль читаются из базы. Без токена, с неверным или истёкшим токеном ожидается 401; для роли `user` на admin-операции — 403. Проверить эти ответы на реальных операциях записи можно будет на этапе 3.

Неверные email или пароль дают одинаковые 401 и сообщение «Неверный email или пароль». Пустой пароль, неверный email и неизвестные поля дают 400. Публичной регистрации, refresh token и logout с отзывом токена нет.

### Ручная проверка этапа 2

1. Заполните настройки и выполните seed дважды. Второй запуск должен сообщить, что запись уже есть, не изменив её.
2. Выполните пример входа с верным паролем: ожидаются 200, JWT и `role: "admin"` без `passwordHash`.
3. Повторите вход с неверным паролем и с неизвестным email: ожидаются одинаковые 401.
4. Передайте пустой пароль или лишнее поле: ожидается 400.
5. Откройте `http://localhost:3000/api/docs`: должны быть login DTO и Bearer-схема.

Не выполняйте seed с временными проверочными данными в основной базе. Для изолированной проверки создайте отдельную локальную базу и задайте для команды её `DATABASE_URL`.

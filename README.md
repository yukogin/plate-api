# Рецепты — Backend API

Этап 1: запускаемый каркас NestJS и схема PostgreSQL. Доступен только `GET /api/v1/health`. Модули входа и рецептов пока не содержат маршрутов; их контракты описаны в `docs/specs/`.

## Требования

- Node.js 24.18.0 (`.nvmrc`) и npm.
- Docker с Docker Compose.

## Локальный запуск

```sh
npm ci
cp .env.example .env
docker compose up -d --wait
npm run db:generate
npm run db:migrate
npm run dev
```

Пример `.env` подключается к контейнеру на `localhost:5433`. При смене порта или реквизитов PostgreSQL обновите `DATABASE_URL` и настройки Compose согласованно. `.env` исключён из Git. `JWT_SECRET`, `ADMIN_EMAIL` и `ADMIN_PASSWORD` пока не используются; их потребуется настроить на этапе 2. `NODE_ENV` принимает `development`, `test` или `production`; `PORT` — число от 1 до 65535. `DATABASE_URL` обязателен. При ошибке обязательной конфигурации приложение завершает запуск с сообщением без вывода URL.

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

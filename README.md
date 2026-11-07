# Рецепты — Backend API

Этапы 1–3: REST API общего каталога рецептов на NestJS и PostgreSQL. Доступны health, вход администратора и CRUD рецептов. Список и детали публичны; создание, изменение и удаление требуют роль `admin`. Контракт описан в `docs/specs/backend-api.md`.

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

Подставьте настроенные данные. Ответ 200 содержит `accessToken`, `tokenType: "Bearer"`, `expiresIn` в секундах и `user` с `id`, `email`, `role`. Для защищённых операций передавайте `Authorization: Bearer <accessToken>`. Токен подписан HS256, содержит `sub`, `iat`, `exp`; на защищённом запросе пользователь и текущая роль читаются из базы. Без токена, с неверным или истёкшим токеном запись возвращает 401; для роли `user` — 403.

Неверные email или пароль дают одинаковые 401 и сообщение «Неверный email или пароль». Пустой пароль, неверный email и неизвестные поля дают 400. Публичной регистрации, refresh token и logout с отзывом токена нет.

### Ручная проверка этапа 2

1. Заполните настройки и выполните seed дважды. Второй запуск должен сообщить, что запись уже есть, не изменив её.
2. Выполните пример входа с верным паролем: ожидаются 200, JWT и `role: "admin"` без `passwordHash`.
3. Повторите вход с неверным паролем и с неизвестным email: ожидаются одинаковые 401.
4. Передайте пустой пароль или лишнее поле: ожидается 400.
5. Откройте `http://localhost:3000/api/docs`: должны быть login DTO и Bearer-схема.

Не выполняйте seed с временными проверочными данными в основной базе. Для изолированной проверки создайте отдельную локальную базу и задайте для команды её `DATABASE_URL`.

## API рецептов

| Метод | Путь | Доступ | Успех |
| --- | --- | --- | --- |
| GET | `/api/v1/recipes` | публичный | 200 |
| GET | `/api/v1/recipes/:id` | публичный | 200 |
| POST | `/api/v1/recipes` | admin | 201 |
| PATCH | `/api/v1/recipes/:id` | admin | 200 |
| DELETE | `/api/v1/recipes/:id` | admin | 204 без тела |

Список принимает `page` (от 1, по умолчанию 1), `limit` (1–100, по умолчанию 20), `search` (до 200 символов после trim). Поиск регистронезависимый по буквальной подстроке `title` или `description`; `%` и `_` не служат шаблонами. Сортировка: `updatedAt DESC`, затем `id DESC`. Список не содержит `ingredients` и `steps`; детали содержат все поля. Пустой результат возвращает `items: []`, `total: 0`, `totalPages: 0`.

Для всех ошибок используется `{"statusCode":400,"error":"Bad Request","message":["..."]}`. Неверный UUID даёт 400, отсутствующий рецепт — 404. В `PATCH` отсутствующее поле не меняется, `null` очищает только необязательное поле, массив заменяется целиком; пустой объект даёт 400. Неизвестные поля отклоняются. Swagger UI: `http://localhost:3000/api/docs`.

### Пример полного цикла

После входа скопируйте `accessToken` из ответа в переменную `TOKEN`:

```sh
TOKEN='<accessToken>'
curl -i -X POST http://localhost:3000/api/v1/recipes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Овсяные панкейки","ingredients":["2 яйца","80 г хлопьев"],"steps":["Смешать","Обжарить"],"prepTimeMinutes":15}'

curl -i 'http://localhost:3000/api/v1/recipes?page=1&limit=20&search=панкейки'
RECIPE_ID='<id из ответа POST>'
curl -i "http://localhost:3000/api/v1/recipes/$RECIPE_ID"

curl -i -X PATCH "http://localhost:3000/api/v1/recipes/$RECIPE_ID" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"description":"Быстрый завтрак","prepTimeMinutes":null}'

curl -i -X DELETE "http://localhost:3000/api/v1/recipes/$RECIPE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Ручная матрица доступа

Проверяйте временные рецепты на отдельной локальной базе. Подготовьте её и запустите API с отдельным портом (настройки JWT берутся из локального `.env`):

```sh
docker compose exec -T postgres createdb -U plate plate_manual_check
CHECK_DATABASE_URL='postgresql://plate:plate_local@localhost:5433/plate_manual_check?schema=public'
DATABASE_URL="$CHECK_DATABASE_URL" npm run db:migrate
DATABASE_URL="$CHECK_DATABASE_URL" ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='<временный пароль от 12 символов>' npm run db:seed-admin
DATABASE_URL="$CHECK_DATABASE_URL" ADMIN_EMAIL=reader@example.com ADMIN_PASSWORD='<другой временный пароль от 12 символов>' npm run db:seed-admin
DATABASE_URL="$CHECK_DATABASE_URL" PORT=3100 npm run dev
```

Проверочный API будет доступен на `http://localhost:3100`. Для каждой из операций POST, PATCH и DELETE ожидаются: без токена и с неверным или истёкшим токеном — 401; с токеном пользователя `user` — 403; с токеном `admin` — успешный код из таблицы выше. GET списка и деталей работает без токена.

Для получения `user` в отдельной проверочной базе можно создать вторую запись командой `db:seed-admin` с другим email, затем изменить её роль через `psql` только в этой базе:

```sh
docker compose exec -T postgres psql -U plate -d plate_manual_check \
  -c "UPDATE \"User\" SET role = 'user' WHERE email = 'reader@example.com'"
```

Проверьте также поиск по `%` (`search=%25`) и `_`, пагинацию за последнюю страницу, пустой PATCH, `null` в обязательных полях, пустые элементы массивов, неизвестные поля, неверный UUID, повторное DELETE и отсутствие SQL или секретов в ответе 500.

После проверки остановите проверочный API и удалите только созданную для неё базу: `docker compose exec -T postgres dropdb -U plate plate_manual_check`.

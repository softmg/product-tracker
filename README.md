# Product Tracker

Внутренний веб-сервис SMG для управления продуктовыми гипотезами по воронке product discovery.

## Что уже готово

- Next.js frontend (App Router, TypeScript, Tailwind + shadcn/ui)
- Docker Compose-инфраструктура для локального full-stack запуска
- Контейнеры: frontend, backend runtime (PHP-FPM + Nginx), PostgreSQL, Redis

## Архитектура

```text
┌──────────────────────┐
│ Browser              │
└──────────┬───────────┘
           │ http://localhost:${FRONTEND_PORT}
           ▼
┌──────────────────────┐      NEXT_PUBLIC_API_URL      ┌──────────────────────────┐
│ Frontend (Next.js)   │ ────────────────────────────> │ Backend (Laravel runtime)│
│ container: frontend  │                                │ container: backend       │
└──────────────────────┘                                └─────────────┬────────────┘
                                                                     │
                                              ┌──────────────────────┴──────────────────────┐
                                              ▼                                             ▼
                                   ┌──────────────────────┐                      ┌──────────────────────┐
                                   │ PostgreSQL 16 (db)   │                      │ Redis 7 (redis)      │
                                   └──────────────────────┘                      └──────────────────────┘
```

## Prerequisites

- Docker Desktop (или совместимый Docker Engine + Compose)
- Node.js 20+ (нужен для запуска frontend вне Docker)

## Quick start

```bash
cp .env.example .env
make up
make migrate
make fresh
```

> `make migrate` и `make fresh` выполняются внутри backend-контейнера. Полноценная Laravel-инициализация добавляется следующими задачами бэкенд-волны.

## Development workflow

### 1) Full-stack через Docker

```bash
cp .env.example .env
make up
```

- Frontend: `http://localhost:${FRONTEND_PORT}`
- Backend: `http://localhost:${BACKEND_PORT}`
- PostgreSQL: `${POSTGRES_PORT}`
- Redis: `${REDIS_PORT}`

### 2) Остановить окружение

```bash
make down
```

### 3) Frontend отдельно (без Docker)

```bash
npm install
npm run dev
```

### 4) Backend shell

```bash
make backend-shell
```

## Testing

```bash
make test-backend
npx vitest
npx playwright test
```

## Структура проекта

```text
app/                     # Next.js App Router
components/              # UI и бизнес-компоненты
lib/                     # типы, mock-данные, auth context, утилиты
backend/                 # backend runtime + (дальше) Laravel приложение
  docker/nginx/
docker-compose.yml       # локальная инфраструктура
Makefile                 # короткие команды для dev workflow
.env.example             # переменные окружения для docker-compose
CLAUDE.md                # правила агента в этом репозитории
AGENTS.md                # архитектурные паттерны и соглашения проекта
```

## Команды Makefile

| Команда | Что делает |
|---|---|
| `make up` | Поднимает все контейнеры в фоне |
| `make down` | Останавливает и удаляет контейнеры |
| `make backend-shell` | Открывает shell в backend-контейнере |
| `make migrate` | Запускает миграции Laravel в backend-контейнере |
| `make test-backend` | Запускает backend-тесты (`php artisan test`) |
| `make fresh` | Выполняет `migrate:fresh --seed` |

## Переменные окружения

Смотри `.env.example`:

- `FRONTEND_PORT`, `BACKEND_PORT`, `POSTGRES_PORT`, `REDIS_PORT` — порты на хосте
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` — bootstrap-конфиг БД
- `NEXT_PUBLIC_API_URL` — URL backend API для frontend

Если порт занят на машине, поменяй значение в `.env` и перезапусти `make up`.

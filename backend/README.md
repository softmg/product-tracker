# Backend (Laravel API)

Backend часть Product Tracker находится в `backend/` и основана на Laravel 12.

## Текущее состояние

- Laravel Framework 12.x
- Пакеты: `laravel/sanctum`, `barryvdh/laravel-dompdf`, `maatwebsite/excel`
- API route file: `routes/api.php`
- Health endpoint: `GET /api/v1/health`
- Базовая CORS-конфигурация для SPA и credentials включена
- Strict mode для Eloquent включён в non-production

## Локальный запуск backend

Из корня проекта:

```bash
cp .env.example .env
make up
make backend-shell
```

Backend доступен по адресу `http://localhost:${BACKEND_PORT}`.

## Переменные окружения backend

`backend/.env.example` содержит ключевые настройки:

- `DB_CONNECTION=pgsql`, `DB_HOST=db`, `DB_PORT=5432`
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `SESSION_DRIVER=redis`
- `REDIS_HOST=redis`, `REDIS_PORT=6379`
- `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, `FRONTEND_URL`
- `API_PREFIX=api`, `API_VERSION=v1`

## API endpoints (MVP plan)

Все endpoint'ы располагаются под префиксом `/api/v1`.

### Health

- `GET /api/v1/health`

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Admin: users / teams

- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/users/{id}`
- `PUT /api/v1/admin/users/{id}`
- `PATCH /api/v1/admin/users/{id}/toggle-active`
- `GET /api/v1/admin/teams`
- `POST /api/v1/admin/teams`
- `PUT /api/v1/admin/teams/{id}`
- `DELETE /api/v1/admin/teams/{id}`

### Hypotheses

- `GET /api/v1/hypotheses`
- `POST /api/v1/hypotheses`
- `GET /api/v1/hypotheses/{id}`
- `PUT /api/v1/hypotheses/{id}`
- `DELETE /api/v1/hypotheses/{id}`

### Status machine / transitions

- `GET /api/v1/hypotheses/{id}/transitions`
- `POST /api/v1/hypotheses/{id}/transition`

### Scoring

- `GET /api/v1/hypotheses/{id}/scoring/{stage}`
- `POST /api/v1/hypotheses/{id}/scoring/{stage}`
- `GET /api/v1/scoring-criteria?stage=primary`

### Deep Dive

- `GET /api/v1/hypotheses/{id}/deep-dive`
- `PUT /api/v1/hypotheses/{id}/deep-dive/{stageId}`
- `POST /api/v1/hypotheses/{id}/deep-dive/{stageId}/comments`
- `GET /api/v1/hypotheses/{id}/deep-dive/progress`

### Respondents

- `GET /api/v1/hypotheses/{id}/respondents`
- `POST /api/v1/hypotheses/{id}/respondents`
- `PUT /api/v1/hypotheses/{hypothesisId}/respondents/{respondentId}`
- `DELETE /api/v1/hypotheses/{hypothesisId}/respondents/{respondentId}`
- `POST /api/v1/respondents/{id}/pains`
- `DELETE /api/v1/respondents/{id}/pains/{painId}`
- `GET /api/v1/hypotheses/{id}/pain-summary`

### Experiments

- `GET /api/v1/hypotheses/{id}/experiments`
- `POST /api/v1/hypotheses/{id}/experiments`
- `PUT /api/v1/hypotheses/{hypothesisId}/experiments/{experimentId}`
- `DELETE /api/v1/hypotheses/{hypothesisId}/experiments/{experimentId}`
- `PATCH /api/v1/experiments/{id}/result`

### Committee / votes

- `GET /api/v1/hypotheses/{id}/votes`
- `POST /api/v1/hypotheses/{id}/votes`
- `POST /api/v1/hypotheses/{id}/finalize-decision`

### Notifications

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}/read`
- `POST /api/v1/notifications/mark-all-read`
- `GET /api/v1/notifications/unread-count`

### Audit log

- `GET /api/v1/audit-log`
- `GET /api/v1/hypotheses/{id}/history`

### Files / export

- `POST /api/v1/hypotheses/{id}/files`
- `GET /api/v1/hypotheses/{id}/files`
- `GET /api/v1/files/{id}/download`
- `DELETE /api/v1/files/{id}`
- `GET /api/v1/hypotheses/{id}/export/pdf`
- `GET /api/v1/hypotheses/{id}/export/excel`

## Миграции и БД workflow

```bash
make migrate
make fresh
```

или напрямую:

```bash
docker compose exec backend php artisan migrate
docker compose exec backend php artisan migrate:fresh --seed
```

## Тесты backend

```bash
make test-backend
```

или напрямую:

```bash
docker compose exec backend php artisan test
```

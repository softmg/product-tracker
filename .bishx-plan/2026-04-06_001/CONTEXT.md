# CONTEXT — Product Tracker: Full-Stack MVP Implementation

## Task
Реализовать полноценный веб-сервис Product Tracker (internal tool для SMG) на основе:
- `tz.md` — полное техническое задание
- `wireframes.md` — ASCII-вайрфреймы всех экранов
- существующий фронтенд на моках (Next.js 16 + React 19 + Tailwind v4 + shadcn/ui)

Добавить бэкенд (Laravel 12 + PHP 8.3 + PostgreSQL), заменить моки на реальное API, реализовать все функциональные модули по ТЗ.

## User Stories

**Инициатор:**
- Создать гипотезу, заполнить обязательные поля и сохранить карточку
- Видеть только свои гипотезы в реестре и дашборде
- Получать уведомление при назначении ответственного

**Product Discovery менеджер:**
- Вести гипотезу по всем этапам воронки
- Видеть все гипотезы, управлять дедлайнами, отслеживать SLA
- Создавать/отмечать подэтапы Deep Dive, управлять экспериментами
- Получать уведомления при нарушении SLA

**Исследователь-аналитик:**
- Проводить первичный и глубокий скоринг
- Вести CRM респондентов, фиксировать боли, загружать артефакты
- Видеть только гипотезы, где назначен аналитиком

**Продуктовый комитет:**
- Просматривать карточку гипотезы (read-only)
- Голосовать: Go / No-Go / Iterate с комментарием
- Видеть на дашборде только гипотезы, ожидающие голосования

**Администратор:**
- Управлять пользователями и ролями
- Настраивать статусы, переходы, условия переходов
- Устанавливать пороги скоринга и SLA
- Настраивать уведомления (Telegram / Confluence)

## Scope

### In Scope (MVP)
- Laravel 12 бэкенд с REST API (JSON)
- PostgreSQL: полная схема БД по ТЗ
- Аутентификация: Laravel Sanctum (token-based SPA auth)
- Ролевая модель: 7 ролей по ТЗ (initiator, pd_manager, analyst, tech_lead, bizdev, committee, admin)
- Реестр гипотез: список, фильтры, поиск, сортировка, создание
- Карточка гипотезы: все поля, вкладки, история
- Скоринг: первичный + глубокий, автоподсчёт, пороги из admin
- Deep Dive: чек-лист подэтапов (13 этапов), CRM респондентов, артефакты
- Эксперименты: список, метрики, ссылки, файлы
- Паспорт гипотезы: автогенерация + экспорт PDF и Excel
- Голосование продуктового комитета: Go/No-Go/Iterate
- Уведомления: Telegram Bot + Confluence API
- Аудит: журнал всех действий
- SLA: контроль сроков, уведомления о нарушениях
- Админка: пользователи, роли, статусы, переходы, скоринг-пороги, SLA, уведомления, комитет, Deep Dive-конфиг
- Docker Compose: backend + db + frontend
- Замена моков во фронтенде на реальные API-вызовы

### Out of Scope (Post-MVP)
- Автогенерация питчдека/презентации
- Интеграция с Coldy, Miro, DWH
- Расширенный аналитический дашборд
- Lean Canvas как отдельный модуль

### Anti-Requirements (Must NOT Do)
- Не хранить пароли в plain text — bcrypt/argon2
- Не делать god-store в Effector — изолированные stores per domain
- Не использовать styles/globals.css (дефолтный shadcn) — только app/globals.css
- Не игнорировать ролевые ограничения на уровне API (не только UI)
- Не коммитить секреты в git

## Key Decisions

| Решение | Обоснование |
|---------|-------------|
| Laravel Sanctum (не Passport/JWT) | SPA auth, session/token в одном, меньше complexity |
| PostgreSQL JSONB для артефактов файлов | Гибкость без лишних таблиц для метаданных |
| Queues (Laravel + Redis) для уведомлений | Telegram/Confluence notify не должен блокировать запрос |
| API-first: версионированный REST `/api/v1/` | Легко тестировать, фронт меняется независимо |
| Effector для state на фронте | По stack.md — изолированные stores per domain |
| Next.js остаётся в корне, Laravel → `backend/` | По CLAUDE.md/AGENTS.md соглашению |
| File storage: local disk (configurable) | S3-compatible в prod через Laravel Filesystem abstraction |

## Assumptions

- PHP 8.3+ и Composer доступны в среде разработки
- Node.js 20+ доступен
- Docker Desktop установлен
- Telegram Bot токен и Confluence credentials предоставляются как env-переменные (не реализуется в плане — только интеграция)
- Файлы хранятся локально (configurable на S3 через `.env`)
- Аутентификация — собственная учётная запись (не корпоративный SSO, если не указано иначе)

## Constraints (Frozen)

- Frontend stack: Next.js 16.2 + React 19 + Tailwind v4 + shadcn/ui — не менять
- Backend: Laravel 12 + PHP 8.3+ + PostgreSQL — по stack.md
- Корпоративные CSS-токены в `app/globals.css` — не изменять без явного требования
- Conventional Commits — по .claude/rules/commit-messages.md

## Risks

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| CORS/Sanctum конфигурация сломает SPA auth | Средняя | Высокое | Настроить `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS` сразу |
| N+1 запросы при загрузке реестра гипотез | Высокая | Среднее | Eager loading через `with()`, API Resource трансформация |
| File upload безопасность | Средняя | Высокое | Validation: mime type, size, sanitize filename |
| Telegram/Confluence интеграция не работает в dev | Высокая | Низкое | Feature flag, graceful degradation |
| Scope creep Deep Dive (13 этапов × артефакты) | Высокая | Среднее | Конфигурируемый чек-лист из Admin |

## Stakeholders & Dependencies

- SMG internal team (заказчик)
- Telegram Bot API (внешняя зависимость, нужен токен)
- Confluence REST API (внешняя зависимость, нужны credentials)

## Success Criteria (Definition of Done)

1. `docker compose up` — весь стек поднимается без ошибок
2. Все 14 критериев приёмки из tz.md §14 выполнены
3. API endpoints покрыты PHPUnit Feature-тестами
4. Реестр гипотез открывается за < 3 секунды при 50+ записях
5. Аудит фиксирует все действия пользователей
6. Уведомления доставляются в Telegram при смене статуса

## Priority Map

**P0 (блокирует остальное):**
- Docker Compose окружение
- Laravel auth (Sanctum) + User/Role model
- DB migrations (core schema)

**P1 (ядро продукта):**
- Hypothesis CRUD + статусная машина
- Scoring module
- Deep Dive module
- Admin: users, statuses, transitions, scoring thresholds

**P2 (полнота MVP):**
- Experiments module
- Passport + PDF/Excel export
- Committee voting
- Notifications (Telegram/Confluence)
- SLA engine

**P3 (завершение):**
- Audit log (полный)
- Frontend: замена моков на real API через Effector stores
- E2E тесты (Playwright)

## Frontend: Current State

Готово (на моках):
- Все страницы и компоненты из wireframes.md реализованы
- `lib/types.ts` — типы данных (частично расходятся с ТЗ, см. Known Gaps в AGENTS.md)
- Аутентификация: mock auth context

Нужно сделать:
- Заменить `lib/mock-data.ts` на API-клиент
- Добавить Effector stores per domain
- Исправить типы под полную ролевую модель (7 ролей)
- Добавить статус `archived` (вместо объединённого `done`)

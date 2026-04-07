# Product Tracker

Внутренний веб-сервис SMG для управления продуктовыми гипотезами по единой воронке discovery: от идеи до решения Go/No-Go/Iterate продуктового комитета.

Полное ТЗ — `tz.md`. ASCII-вайрфреймы всех экранов — `wireframes.md`.

## Where things live

```
app/
  (auth)/              # login, forgot-password, reset-password
  (dashboard)/
    dashboard/         # личный дашборд (адаптивный под роль)
    hypotheses/        # реестр + карточка ([id]) + создание (new)
    admin/             # настройки: users, teams, statuses, transitions,
                       # scoring, scoring-thresholds, sla, notifications,
                       # committee, deep-dive, audit
    notifications/     # центр уведомлений
    analytics/         # базовая аналитика
    403/               # страница запрета доступа
  globals.css          # ЕДИНСТВЕННЫЙ CSS (дизайн-токены, статусные цвета)
  layout.tsx           # root layout, ThemeProvider

components/
  layout/              # AppSidebar, Header, NotificationDropdown
  hypotheses/          # бизнес-компоненты карточки гипотезы
  ui/                  # shadcn/ui компоненты (не трогать вручную)

lib/
  types.ts             # все TypeScript типы (единственный источник)
  mock-data.ts         # тестовые данные (обновлять при изменении модели)
  auth-context.tsx     # AuthProvider поверх Effector auth-store + rolePermissions
  utils.ts             # cn() и прочие утилиты

styles/
  globals.css          # НЕ ИСПОЛЬЗОВАТЬ — дефолтный shadcn с oklch

backend/
  Dockerfile           # PHP-FPM runtime image
  .dockerignore        # исключения для backend build context
  docker/nginx/default.conf # Nginx config proxying to PHP-FPM

docker-compose.yml     # локальный full-stack compose: frontend, backend, db, redis
Makefile               # команды: up/down/backend-shell/migrate/test-backend/fresh
.env.example           # env для docker-compose

tz.md                  # полное техническое задание
wireframes.md          # ASCII-вайрфреймы всех экранов MVP
```

## How to add new things

**Новый экран внутри dashboard:**
1. Добавить `app/(dashboard)/<route>/page.tsx`
2. Если нужна секция в сайдбаре — добавить в `components/layout/app-sidebar.tsx`
3. Бизнес-компоненты → `components/<domain>/`

**Новый shadcn компонент:**
```bash
npx shadcn@latest add <component>
```
Проверить, что его нет в `components/ui/` перед установкой.

**Новый тип данных:**
1. Добавить в `lib/types.ts`
2. Добавить mock-данные в `lib/mock-data.ts`

**Новое поле в Hypothesis:**
1. `lib/types.ts` — добавить в интерфейс
2. `lib/mock-data.ts` — обновить все mock-объекты
3. Форма создания: `app/(dashboard)/hypotheses/new/page.tsx`
4. Карточка: `app/(dashboard)/hypotheses/[id]/page.tsx`

**Новая страница Admin:**
1. `app/(dashboard)/admin/<section>/page.tsx`
2. Добавить пункт в `app-sidebar.tsx` под adminNavItems

## Patterns (do not break)

- Все типы — в `lib/types.ts`. Не создавать локальных type/interface в компонентах
- `any` запрещён — использовать `unknown` или конкретные типы
- Стили — только Tailwind utility + CSS-переменные из `app/globals.css`. Не использовать `styles/globals.css`
- `"use client"` — только там, где нужны хуки или события браузера. Серверные компоненты по умолчанию
- shadcn/ui компоненты — не модифицировать напрямую, обёртывать в бизнес-компоненты
- Авторизация: `useAuth()` из `lib/auth-context.tsx`, проверка через `hasPermission()`
- Layout dashboard защищён: редирект на `/login` если не авторизован (см. `app/(dashboard)/layout.tsx`)
- Роли в UI и mock-модели: `admin|initiator|pd_manager|analyst|tech_lead|bizdev|committee`
- `useAuth()` использует Effector store (`lib/stores/auth/model.ts`) и сохраняет прежний API контекста
- Mock-данные изменять всегда при изменении типов

## Terms

| Термин | Значение |
|--------|----------|
| Гипотеза | Основной объект системы. Карточка с описанием, артефактами, скорингом, экспериментами |
| Воронка | Последовательность статусов: Идея → Скоринг → Deep Dive → Эксперимент → Питч → Done |
| Deep Dive | Этап глубокого анализа: чек-лист подэтапов, CRM респондентов, артефакты |
| Скоринг | Балльная оценка гипотезы по критериям. Первичный (экспресс) и глубокий |
| Паспорт | Сводный документ гипотезы — автосборка из данных карточки, экспортируется в PDF/Excel |
| Продуктовый комитет (ПК) | Голосующий орган: Go / No-Go / Iterate. Состав задаётся в Admin → Committee |
| SLA | Максимальное допустимое время нахождения в статусе. Настраивается в Admin → SLA |

## Environment and run modes

- Frontend only: `npm run dev`
- Full local stack (Docker): `make up` or `docker compose up -d`
- Stop stack: `make down`
- Backend shell: `make backend-shell`
- Backend migrations/tests (после инициализации Laravel): `make migrate`, `make fresh`, `make test-backend`

## Known Gaps (TZ vs Implementation)

| Gap | Где | Приоритет |
|-----|-----|-----------|
| Статус `analysis` не в ТЗ | `lib/types.ts` HypothesisStatus | Low |
| `done` объединяет "Решение" + "Архив" | Модель данных | При бэкенде |
| Нет `initiatorId`, `priority` в Hypothesis | `lib/types.ts` | Medium |
| Нет реального API для большинства доменов | Весь проект | Следующая фаза |
| Effector внедрён для auth, остальные домены пока на local state/mock | `lib/stores/auth/*` и UI-экраны | Следующая фаза |
| Laravel skeleton ещё не инициализирован | `backend/` (только runtime и nginx config) | Ближайшая backend-волна |
| Локальные порты в `.env` могут отличаться от `.env.example` при конфликтах | root `.env` | По необходимости |

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

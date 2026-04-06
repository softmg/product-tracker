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
  auth-context.tsx     # mock-авторизация + rolePermissions
  utils.ts             # cn() и прочие утилиты

styles/
  globals.css          # НЕ ИСПОЛЬЗОВАТЬ — дефолтный shadcn с oklch

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
- Роли сейчас упрощены (admin/po/viewer вместо 7 по ТЗ) — при добавлении бэкенда расширить
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

## Known Gaps (TZ vs Implementation)

| Gap | Где | Приоритет |
|-----|-----|-----------|
| Роли упрощены (3 вместо 7) | `lib/types.ts` UserRole | При бэкенде |
| Статус `analysis` не в ТЗ | `lib/types.ts` HypothesisStatus | Low |
| `done` объединяет "Решение" + "Архив" | Модель данных | При бэкенде |
| Нет `initiatorId`, `priority` в Hypothesis | `lib/types.ts` | Medium |
| Нет реального API | Весь проект | Следующая фаза |
| Effector не подключён | — | Следующая фаза |

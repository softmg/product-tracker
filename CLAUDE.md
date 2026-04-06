# CLAUDE.md

Rules for the AI agent working with **Product Tracker** — внутренний веб-сервис SMG для управления продуктовыми гипотезами по воронке product discovery.

When changing stack or patterns — update `AGENTS.md`. Facts only. On task completion.

---

## Constraints

- OWASP Top 10 — check always
- Secrets only in `.env`, never commit
- `any` — запрещён в TypeScript
- `styles/globals.css` — не использовать (default shadcn с oklch, конфликтует). Только `app/globals.css`
- `next.config.mjs` имеет `ignoreBuildErrors: true` — это временно, не полагаться на это

## Stack

- **Frontend**: Next.js 16.2 (App Router) + React 19 + TypeScript 5.7 strict
- **Styles**: Tailwind CSS v4 + shadcn/ui + `app/globals.css` (корпоративные токены)
- **Data**: mock — `lib/mock-data.ts` (реального API нет)
- **Auth**: mock auth context — `lib/auth-context.tsx`
- **Backend (planned)**: Laravel 12 + PHP 8.3 + PostgreSQL — выносить в `backend/`
- **State (planned)**: Effector 23+ (пока React state)
- **Tests (planned)**: Vitest (unit), Playwright (E2E)

## Environment

- Node.js + `npm run dev` для запуска
- Path alias: `@/*` → project root
- Fonts: Inter (основной), Geist Mono (моно)

## Architecture

Don't break the foundation — patterns and structure in `AGENTS.md`.

Корпоративные цвета — тёмная тема: bg `#08081E`, cards `#0F0F2A`, border `#1C1C3A`, accent `#6228FF` (одинаков в light/dark). Все токены в `app/globals.css`.

## Git

- Branch: `main`
- Conventional commits в English: `<type>: <subject>`
- Types: `feat|fix|refactor|perf|docs|test|build|ci|chore|style|revert|deps|security`
- Subject: imperative, no period, max 72 chars
- Co-Authored-By с актуальным именем модели (из system prompt) в каждом коммите
- Atomic commits

```bash
git pull --rebase origin main
git add -A
git commit -m "$(cat <<'EOF'
feat: add hypothesis scoring form

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
git push origin main
```

> Подставлять реальное имя модели из system prompt (например Sonnet 4.6, Opus 4.6)

## bd (beads)

Local task tracking. `bd ready` → `bd update <id> --status in_progress` → work → commit+push → `bd close <id>` → `bd sync`.

## Task completion (HARD GATE)

Task is NOT complete until:
1. `git push origin main` — succeeded
2. `git status --porcelain` — empty
3. `bd close` + `bd sync` — executed

Never say "ready to push". Agent pushes by itself.

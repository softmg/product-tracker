# Code Standards

## PHP / Laravel

- PSR-12 coding style
- `declare(strict_types=1)` in every file
- Business logic in **Services** or **Actions**, never in Controllers
- Validate all external input via **Laravel Form Requests**
- Use **migrations** for every schema change — never modify DB manually
- Prefer explicit API contracts; version endpoints when changes are breaking

## React / Effector

- Isolated **stores and effects per domain** — no global god-store
- Keep components small and focused on rendering
- Extract business logic out of components into Effector models
- Use typed props; avoid `any`

## General

- Document public APIs and complex algorithms with JSDoc / PHPDoc
- Remove dead code — no commented-out blocks in PRs
- No hardcoded values that belong in config or `.env`
- Prefer explicit over implicit — readable code over clever code

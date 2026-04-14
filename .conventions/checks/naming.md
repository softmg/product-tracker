# Naming Conventions

## Files
- Feature/components/hooks/modules: kebab-case
- Next App Router reserved files: lowercase fixed names (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`)
- Types live in `types.ts`, store model entrypoint in `model.ts`

Regex:
- General TS/TSX file: `^[a-z0-9]+(?:-[a-z0-9]+)*\.(ts|tsx)$`
- App Router special files: `^(page|layout|error|not-found)\.tsx$`

Examples:
- `components/hypotheses/hypothesis-table.tsx`
- `hooks/use-mobile.ts`
- `app/(dashboard)/admin/users/page.tsx`

## Symbols
- React components: PascalCase (`HypothesisTable`, `StatusBadge`)
- Functions/variables: camelCase (`handleSort`, `teamNamesById`)
- Constants: UPPER_SNAKE_CASE (`MOBILE_BREAKPOINT`, `ITEMS_PER_PAGE`)
- Boolean flags: `is/has/should` prefix (`isMobile`, `hasPermission`)

Regex:
- Component/function export in TSX: `^export (default )?function [A-Z][A-Za-z0-9]*\(`
- camelCase function: `^(export )?function [a-z][A-Za-z0-9]*\(`
- Constant: `^const [A-Z][A-Z0-9_]*\b`

## Domain/API Values
- API/domain status/stage string values are snake_case (`deep_dive`, `go_no_go`)
- Type/interface names are PascalCase; backend-facing DTOs may use `Api` prefix (`ApiHypothesisList`)

Regex:
- snake_case string value: `^[a-z0-9]+(?:_[a-z0-9]+)*$`
- Type/interface name: `^(Api)?[A-Z][A-Za-z0-9]*$`

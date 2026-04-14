# Import Conventions

## Preferred Order
1. External packages (`react`, `next`, `effector`, `vitest`)
2. Internal aliases from `@/`
3. Relative imports (`./`, `../`) only for same-feature siblings
4. Type-only imports via `import type`

## Project Rules
- Prefer `@/` alias for app code (`@/components`, `@/lib`, `@/hooks`, `@/lib/stores/*`)
- UI primitives come from `@/components/ui/*`
- Utility class merge helper comes from `@/lib/utils`
- Domain types come from `@/lib/types` or store-local `types.ts`
- Backend routes/controllers use top-level class imports + `Route` declarations

## Allowed Patterns
```ts
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Hypothesis } from "@/lib/types"
import { StatusBadge } from "./status-badge"
```

## Avoid
- Direct `@/lib/mock-data` imports in new page/store migrations
- Deep relative imports when `@/` alias is available
- Duplicating hook/util implementations in multiple files
- Frontend store paths that drift from backend `backend/routes/api.php` contracts

## Quick Checks
- Client files using hooks/state start with `"use client"`
- If importing only types, use `import type`
- Keep one quote style per file (prefer double quotes in TypeScript files)

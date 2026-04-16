# Avoid Direct `lib/mock-data` Imports In Pages And Feature Components

Prefer store/model or API DTO layers over importing mock collections straight into pages and domain components.

## BAD

```tsx
import { mockAuditLog, statusDisplayInfo } from "@/lib/mock-data"

export default function AdminAuditPage() {
  const rows = mockAuditLog
  return <div>{rows.length}</div>
}
```

## GOOD

```ts
import { combine, createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"
import type { ApiHypothesisList } from "@/lib/stores/hypotheses/types"

export const fetchHypothesesFx = createEffect(async (): Promise<ApiHypothesisList[]> => {
  const { data } = await apiClient.get<{ data: ApiHypothesisList[] }>("/api/v1/hypotheses")
  return data.data
})

export const $hypotheses = createStore<ApiHypothesisList[]>([]).on(fetchHypothesesFx.doneData, (_, items) => items)
export const $hasHypotheses = combine($hypotheses, (items) => items.length > 0)
```

**Why:** The repo is in the middle of moving frontend code away from page-level mocks. Direct `mock-data` imports freeze pages to fake data and make backend migration harder.

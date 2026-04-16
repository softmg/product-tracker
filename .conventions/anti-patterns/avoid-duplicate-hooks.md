# Avoid Duplicate Hook Implementations

Keep one canonical hook implementation and import it where needed instead of copying the same logic into multiple files.

## BAD

```ts
// hooks/use-mobile.ts
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  // ...matchMedia logic
  return !!isMobile
}

// components/ui/use-mobile.tsx
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  // ...same matchMedia logic
  return !!isMobile
}
```

## GOOD

```ts
// hooks/use-mobile.ts
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  // ...single implementation
  return !!isMobile
}

// consumer
import { useIsMobile } from "@/hooks/use-mobile"
```

**Why:** This repo currently has the same `useIsMobile` hook in two places. Duplicate hooks invite silent drift and inconsistent behavior.

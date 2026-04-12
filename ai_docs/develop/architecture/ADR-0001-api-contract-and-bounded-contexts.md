# ADR-0001: API contract source-of-truth and bounded contexts

- Date: 2026-04-12
- Status: Accepted

## Context

Frontend domain stores and backend API drifted in route naming and DTO shape, creating brittle adapter logic and increasing runtime risk.

Observed examples:
- Scoring/analytics/admin endpoints in frontend stores did not match Laravel route contracts.
- Admin and analytics DTO field expectations diverged from Laravel resource/service output.

## Decision

1. **Canonical contract owner**
   - Laravel API v1 (`backend/routes/api.php` + `backend/app/Http/Resources/*`) is the canonical contract source.

2. **Frontend contract policy**
   - Frontend stores align endpoint paths and DTO fields to backend canonical output.
   - Store tests must assert canonical route usage for touched domains.

3. **DDD boundary policy**
   - System is organized by bounded contexts:
     - Identity & Access
     - Hypothesis Lifecycle
     - Scoring
     - Deep Dive
     - Experimentation
     - Committee Decision
     - Notifications
     - Analytics
     - Admin Configuration
   - Anti-corruption mapping is allowed at context boundaries, but should be reduced as contracts stabilize.

4. **Wave strategy**
   - Wave 1 applies to Scoring, Analytics, Admin Configuration.
   - Remaining contexts migrate incrementally with explicit test gates.

## Consequences

### Positive
- Lower risk of frontend/backend integration regressions.
- Fewer ad-hoc mappers and less duplicated contract logic in UI.
- Clearer ownership of API evolution.

### Costs / trade-offs
- Existing tests and models must be updated when backend contract changes.
- Some mock-driven UI paths may temporarily require bridging until full migration.

## Implementation notes (Wave 1)

Aligned frontend stores/tests to canonical endpoints:
- `lib/stores/scoring/model.ts`
- `lib/stores/scoring/__tests__/model.test.ts`
- `lib/stores/analytics/model.ts`
- `lib/stores/admin/config.ts`
- `lib/stores/admin/__tests__/config.test.ts`

## Verification

- Targeted frontend tests for scoring/admin stores pass.
- Backend targeted tests require running backend service (`docker compose up -d`) before execution.

## Related files

- `backend/routes/api.php`
- `backend/app/Http/Resources/StatusTransitionResource.php`
- `backend/app/Http/Resources/NotificationEventResource.php`
- `backend/app/Services/AnalyticsService.php`
- `ai_docs/develop/architecture/architecture-assessment-api-contract-alignment.md`

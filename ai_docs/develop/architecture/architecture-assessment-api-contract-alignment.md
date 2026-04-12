# Architecture Assessment — API Contract Alignment (Wave 1)

## Scope

Current stack has frontend Effector stores and Laravel API v1 running in parallel. This assessment focuses on confirmed contract drift in Wave 1 domains:
- Scoring
- Analytics
- Admin configuration (status transitions, notification events)

## Current architecture snapshot

- Frontend domain stores call API through `lib/api-client.ts`.
- Backend routes are centralized in `backend/routes/api.php`.
- Resource payload shape is defined by Laravel resources in `backend/app/Http/Resources/*`.

## Confirmed contract drift (before fix)

| Domain | Frontend endpoint | Backend canonical endpoint |
|---|---|---|
| Scoring criteria | `/api/v1/scoring/criteria` | `/api/v1/scoring-criteria` |
| Analytics initiator stats | `/api/v1/analytics/by-initiator` | `/api/v1/analytics/initiator-stats` |
| Analytics team stats | `/api/v1/analytics/by-team` | `/api/v1/analytics/team-stats` |
| Admin transitions | `/api/v1/admin/config/transitions` | `/api/v1/admin/status-transitions` |
| Admin notifications | `/api/v1/admin/config/notifications` | `/api/v1/admin/notification-events` |

## Payload drift

### Analytics
Backend returns `name` fields from service (`backend/app/Services/AnalyticsService.php`) while FE model expected `user_name` / `team_name`.

### Admin transitions
Backend resource (`StatusTransitionResource`) returns:
- `allowed_roles`
- `condition_type`
- `condition_value`
- `is_active`

FE store model expected:
- `label`
- `required_role`
- `requires_comment`

### Admin notification events
Backend resource (`NotificationEventResource`) returns:
- `event_type`
- `recipients`
- `template`
- `channel`
- `is_active`

FE store model expected:
- `event`
- `channels`

## Risk ranking

- **P0**: broken endpoints in stores (`404`/contract mismatch risk)
- **P1**: shape mismatch causing runtime assumptions and UI adapter growth
- **P2**: broader lifecycle status vocabulary divergence (`analysis` vs backend `archived`) across mocks/UI

## Wave 1 decisions

1. Laravel API v1 routes/resources are canonical contract source.
2. Frontend stores align to canonical endpoints immediately.
3. Frontend store DTOs align to backend resource payload for touched domains.
4. Test assertions must verify canonical endpoint usage.

## DDD framing (incremental)

Bounded contexts for progressive hardening:
- Identity & Access
- Hypothesis Lifecycle
- Scoring
- Deep Dive
- Experimentation
- Committee Decision
- Notifications
- Analytics
- Admin Configuration

Wave 1 touches Scoring, Analytics, Admin Configuration only.

## Implemented in this wave

- Scoring store endpoint aligned to `/api/v1/scoring-criteria`.
- Analytics store endpoints aligned to `/api/v1/analytics/initiator-stats` and `/api/v1/analytics/team-stats`.
- Admin config store endpoints aligned to `/api/v1/admin/status-transitions` and `/api/v1/admin/notification-events`.
- Admin/scoring store tests updated to assert canonical endpoints.
- Admin store DTO model aligned to backend resource fields for transitions and notification events.

## Follow-ups

1. Normalize lifecycle status vocabulary across `lib/types.ts`, mock data, and backend enum.
2. Replace remaining mock-heavy admin/analytics pages with store-backed data flow.
3. Add contract tests that snapshot route + resource fields for critical contexts.
4. Remove temporary adapters once all pages consume canonical DTOs directly.

# Implementation Plan: Product Tracker — Full-Stack MVP

## Requirements Summary

Product Tracker — internal SMG web service for managing product hypotheses through a discovery funnel: from idea to Go/No-Go/Iterate decision. The system includes hypothesis registry with configurable status machine, primary/deep scoring, Deep Dive with checklists and artifacts, experiments with metrics, committee voting, SLA engine, Telegram/Confluence notifications, audit log, admin panel, and PDF/Excel export.

**Current state:** Frontend (Next.js 16.2 + React 19 + shadcn/ui) is fully built on mocks. All pages exist. No backend.

**Goal:** Add Laravel 12 backend with PostgreSQL, replace mocks with real API via Effector stores, add Docker Compose infrastructure.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌────────┐ │
│  │ Frontend │  │ Backend  │  │  DB   │  │ Redis  │ │
│  │ Next.js  │  │ Laravel  │  │ PgSQL │  │ Queue  │ │
│  │ :3000    │  │ :8000    │  │ :5432 │  │ :6379  │ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘  └───┬────┘ │
│       │              │            │           │      │
│       └──── API ─────┘            │           │      │
│              │                    │           │      │
│              └────────────────────┴───────────┘      │
└─────────────────────────────────────────────────────┘

Frontend ──(Effector effects)──> /api/v1/* ──> Laravel Controllers
                                                   │
                                         Services / Actions
                                                   │
                                              Eloquent Models
                                                   │
                                               PostgreSQL
```

**API versioning:** All endpoints under `/api/v1/`.
**Auth:** Laravel Sanctum with SPA cookie-based auth (CSRF token + session cookie).
**File storage:** Laravel filesystem (local disk in MVP, S3-ready).
**Queues:** Redis driver for notifications and heavy operations.

## Pre-requisites

- Docker Desktop installed
- PHP 8.3+ (for local `composer` if needed outside Docker)
- Node.js 20+ (already used for frontend)
- No external services needed for local dev (Telegram/Confluence are optional integrations)

## Impact Analysis

### CI/CD Impact
- [x] New Docker infrastructure — needs `docker-compose.yml` and Dockerfiles
- [x] New backend dependency — Composer install in CI
- [x] New env vars — `.env` for Laravel (DB, Redis, Sanctum, Telegram)
- [x] DB migrations — must run before backend tests

### Documentation Impact
- [x] New API — OpenAPI docs should be added (out of scope for MVP, manual API list in plan)
- [x] README update needed — setup instructions for Docker Compose

### Observability Impact
- [x] New error types — Laravel logging to `storage/logs`
- [x] Audit log module covers all entity changes
- [x] SLA violations generate notifications

---

## Tasks

### Task T01: Docker Compose Setup

**Files:** `docker-compose.yml`, `backend/Dockerfile`, `backend/.dockerignore`, `.env.example`, `Makefile`
**Depends on:** none
**Complexity:** M
**Risk:** LOW
**Input:** Existing frontend project in root directory
**Output:** `docker compose up` starts 4 services: backend (PHP-FPM + Nginx), PostgreSQL, Redis, frontend (Next.js dev server)
**Rollback:** `docker compose down -v && rm docker-compose.yml backend/Dockerfile .env.example Makefile`

#### What to do

1. Create `docker-compose.yml` with services:
   - `backend`: PHP 8.3-FPM + Nginx, volume-mount `./backend`, port 8000
   - `db`: PostgreSQL 16, port 5432, volume for data persistence, env: `POSTGRES_DB=product_tracker`, `POSTGRES_USER=tracker`, `POSTGRES_PASSWORD=secret`
   - `redis`: Redis 7-alpine, port 6379
   - `frontend`: Node 20-alpine, volume-mount `./` (root), port 3000, command `npm run dev`
   - Network: `tracker-net` (bridge)

2. Create `backend/Dockerfile`:
   ```dockerfile
   FROM php:8.3-fpm-alpine
   RUN apk add --no-cache postgresql-dev libzip-dev && \
       docker-php-ext-install pdo_pgsql zip bcmath
   COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
   WORKDIR /var/www/html
   COPY . .
   RUN composer install --no-dev --optimize-autoloader || true
   ```
   Plus an Nginx config file `backend/docker/nginx/default.conf` that proxies to PHP-FPM.

3. Create `.env.example` at project root with all Docker env vars.

4. Create `Makefile` with shortcuts:
   - `make up` — `docker compose up -d`
   - `make down` — `docker compose down`
   - `make backend-shell` — `docker compose exec backend sh`
   - `make migrate` — `docker compose exec backend php artisan migrate`
   - `make test-backend` — `docker compose exec backend php artisan test`
   - `make fresh` — `docker compose exec backend php artisan migrate:fresh --seed`

#### TDD
Skip TDD (infrastructure). Verification via smoke commands.

#### Verify
```bash
docker compose up -d && sleep 5 && docker compose ps && curl -s http://localhost:3000 | head -5
```

#### Acceptance Criteria
- [ ] `docker compose up -d` starts all 4 services without errors
- [ ] `docker compose ps` shows all services as "running"
- [ ] PostgreSQL accepts connections: `docker compose exec db psql -U tracker -d product_tracker -c "SELECT 1"`
- [ ] Redis accepts connections: `docker compose exec redis redis-cli ping` returns PONG
- [ ] Frontend accessible at http://localhost:3000

---

### Task T02: Laravel Project Initialization

**Files:** `backend/` directory (full Laravel 12 scaffold), `backend/.env`, `backend/config/cors.php`, `backend/config/sanctum.php`, `backend/routes/api.php`
**Depends on:** T01
**Complexity:** M
**Risk:** LOW
**Input:** Empty `backend/` directory with only Dockerfile
**Output:** Working Laravel 12 installation with Sanctum configured, health endpoint responding
**Rollback:** `rm -rf backend/` (except Dockerfile, restore from git)

#### What to do

1. Inside Docker backend container (or locally with PHP 8.3), run:
   ```bash
   composer create-project laravel/laravel backend --prefer-dist
   ```

2. Install required packages:
   ```bash
   cd backend
   composer require laravel/sanctum
   composer require barryvdh/laravel-dompdf
   composer require maatwebsite/excel
   ```

3. Configure `backend/.env`:
   ```
   DB_CONNECTION=pgsql
   DB_HOST=db
   DB_PORT=5432
   DB_DATABASE=product_tracker
   DB_USERNAME=tracker
   DB_PASSWORD=secret
   
   CACHE_DRIVER=redis
   QUEUE_CONNECTION=redis
   SESSION_DRIVER=redis
   REDIS_HOST=redis
   
   SANCTUM_STATEFUL_DOMAINS=localhost:3000
   SESSION_DOMAIN=localhost
   ```

4. Configure `backend/config/cors.php`:
   ```php
   'paths' => ['api/*', 'sanctum/csrf-cookie'],
   'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
   'supports_credentials' => true,
   ```

5. Publish Sanctum config:
   ```bash
   php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
   ```

6. Add health endpoint in `backend/routes/api.php`:
   ```php
   Route::prefix('v1')->group(function () {
       Route::get('/health', fn () => response()->json([
           'status' => 'ok',
           'timestamp' => now()->toIso8601String(),
       ]));
   });
   ```

7. Configure `backend/app/Providers/AppServiceProvider.php` to enforce strict models in dev:
   ```php
   Model::shouldBeStrict(! $this->app->isProduction());
   ```

#### TDD
Skip TDD (scaffold). Verify via health endpoint.

#### Verify
```bash
docker compose exec backend php artisan --version && \
curl -s http://localhost:8000/api/v1/health | jq .
```

#### Acceptance Criteria
- [ ] `php artisan --version` shows Laravel 12.x
- [ ] `curl http://localhost:8000/api/v1/health` returns `{"status":"ok",...}`
- [ ] `php artisan config:show database` shows pgsql connection
- [ ] `php artisan config:show sanctum` shows correct stateful domains

---

### Task T03: Database Migrations — Core Schema (Users, Teams, Hypotheses, Statuses)

**Files:**
- `backend/database/migrations/0001_01_01_000000_create_users_table.php` (modify default)
- `backend/database/migrations/2026_04_07_000001_create_teams_table.php`
- `backend/database/migrations/2026_04_07_000002_create_hypotheses_table.php`
- `backend/database/migrations/2026_04_07_000003_create_hypothesis_status_history_table.php`
- `backend/database/migrations/2026_04_07_000004_create_status_transitions_table.php`
- `backend/database/migrations/2026_04_07_000005_create_sla_configs_table.php`
- `backend/app/Enums/HypothesisStatus.php`
- `backend/app/Enums/UserRole.php`
- `backend/app/Enums/Priority.php`
- `backend/app/Models/User.php` (modify)
- `backend/app/Models/Team.php`
- `backend/app/Models/Hypothesis.php`
- `backend/app/Models/HypothesisStatusHistory.php`
- `backend/app/Models/StatusTransition.php`
- `backend/app/Models/SlaConfig.php`

**Depends on:** T02
**Complexity:** L
**Risk:** MEDIUM
**Input:** Default Laravel users migration, empty DB
**Output:** Core tables created, Eloquent models with relationships defined
**Rollback:** `php artisan migrate:rollback --step=6`

#### What to do

1. Create PHP Enums:

`backend/app/Enums/HypothesisStatus.php`:
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum HypothesisStatus: string
{
    case Backlog = 'backlog';
    case Scoring = 'scoring';
    case DeepDive = 'deep_dive';
    case Experiment = 'experiment';
    case GoNoGo = 'go_no_go';
    case Done = 'done';
    case Archived = 'archived';
}
```

`backend/app/Enums/UserRole.php`:
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Initiator = 'initiator';
    case PdManager = 'pd_manager';
    case Analyst = 'analyst';
    case TechLead = 'tech_lead';
    case BizDev = 'bizdev';
    case Committee = 'committee';
}
```

`backend/app/Enums/Priority.php`:
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum Priority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
}
```

2. Modify default users migration to add fields: `role` (UserRole enum), `team_id` (FK nullable), `is_active` (boolean default true), `last_login_at` (timestamp nullable).

3. Create teams migration:
```php
Schema::create('teams', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->timestamps();
});
```

4. Create hypotheses migration:
```php
Schema::create('hypotheses', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique(); // HYP-001
    $table->string('title');
    $table->text('description')->nullable();
    $table->text('problem')->nullable();
    $table->text('solution')->nullable();
    $table->text('assumptions')->nullable();
    $table->text('target_audience')->nullable();
    $table->string('status')->default('backlog'); // HypothesisStatus enum
    $table->string('priority')->default('medium'); // Priority enum
    $table->foreignId('initiator_id')->constrained('users');
    $table->foreignId('owner_id')->nullable()->constrained('users');
    $table->foreignId('team_id')->nullable()->constrained('teams');
    $table->decimal('scoring_primary', 5, 2)->nullable();
    $table->decimal('scoring_deep', 5, 2)->nullable();
    $table->timestamp('sla_deadline')->nullable();
    $table->string('sla_status')->nullable(); // 'ok', 'warning', 'violated'
    $table->timestamps();
    $table->index('status');
    $table->index('initiator_id');
    $table->index('owner_id');
});
```

5. Create hypothesis_status_history:
```php
Schema::create('hypothesis_status_history', function (Blueprint $table) {
    $table->id();
    $table->foreignId('hypothesis_id')->constrained()->cascadeOnDelete();
    $table->string('from_status')->nullable();
    $table->string('to_status');
    $table->foreignId('changed_by')->constrained('users');
    $table->text('comment')->nullable();
    $table->timestamps();
    $table->index('hypothesis_id');
});
```

6. Create status_transitions:
```php
Schema::create('status_transitions', function (Blueprint $table) {
    $table->id();
    $table->string('from_status');
    $table->string('to_status');
    $table->jsonb('allowed_roles')->default('[]');
    $table->string('condition_type')->default('none'); // none, required_fields, scoring_threshold, checklist_closed
    $table->string('condition_value')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->unique(['from_status', 'to_status']);
});
```

7. Create sla_configs:
```php
Schema::create('sla_configs', function (Blueprint $table) {
    $table->id();
    $table->string('status')->unique();
    $table->integer('limit_days');
    $table->integer('warning_days');
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

8. Create Eloquent models with proper `$casts`, `$fillable`, and relationships:
   - `User`: belongsTo Team, hasMany Hypothesis (as initiator), hasMany Hypothesis (as owner), cast role to UserRole enum
   - `Team`: hasMany User, hasMany Hypothesis
   - `Hypothesis`: belongsTo User (initiator), belongsTo User (owner), belongsTo Team, hasMany StatusHistory, cast status to HypothesisStatus, cast priority to Priority
   - `HypothesisStatusHistory`: belongsTo Hypothesis, belongsTo User (changedBy)
   - `StatusTransition`: cast allowed_roles to array
   - `SlaConfig`: cast status to HypothesisStatus

#### TDD

**RED phase:**
`backend/tests/Unit/Models/HypothesisTest.php`:
```php
public function test_hypothesis_has_correct_casts(): void
{
    $hypothesis = new Hypothesis();
    $this->assertArrayHasKey('status', $hypothesis->getCasts());
    $this->assertArrayHasKey('priority', $hypothesis->getCasts());
}

public function test_hypothesis_belongs_to_initiator(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create(['initiator_id' => $user->id]);
    $this->assertEquals($user->id, $hypothesis->initiator->id);
}
```

**GREEN phase:** Implement models and factories as described above.

**REFACTOR:** Extract common migration patterns if any.

#### Verify
```bash
docker compose exec backend php artisan migrate && \
docker compose exec backend php artisan test --filter=HypothesisTest
```

#### Acceptance Criteria
- [ ] `php artisan migrate` runs without errors
- [ ] All 6 tables exist in PostgreSQL with correct columns
- [ ] `php artisan tinker` — `User::factory()->create()` works
- [ ] `Hypothesis::factory()->create()` works with proper relationships
- [ ] Enums cast correctly on model access

---

### Task T04: Database Migrations — Content Schema (Scoring, Deep Dive, Experiments, Committee, Audit, Notifications, Files, Respondents)

**Files:**
- `backend/database/migrations/2026_04_07_000010_create_scoring_criteria_table.php`
- `backend/database/migrations/2026_04_07_000011_create_hypothesis_scorings_table.php`
- `backend/database/migrations/2026_04_07_000012_create_scoring_threshold_configs_table.php`
- `backend/database/migrations/2026_04_07_000013_create_deep_dive_stages_table.php`
- `backend/database/migrations/2026_04_07_000014_create_hypothesis_deep_dives_table.php`
- `backend/database/migrations/2026_04_07_000015_create_hypothesis_files_table.php`
- `backend/database/migrations/2026_04_07_000016_create_respondents_table.php`
- `backend/database/migrations/2026_04_07_000017_create_respondent_pains_table.php`
- `backend/database/migrations/2026_04_07_000018_create_respondent_artifacts_table.php`
- `backend/database/migrations/2026_04_07_000019_create_experiments_table.php`
- `backend/database/migrations/2026_04_07_000020_create_experiment_metrics_table.php`
- `backend/database/migrations/2026_04_07_000021_create_committee_members_table.php`
- `backend/database/migrations/2026_04_07_000022_create_committee_votes_table.php`
- `backend/database/migrations/2026_04_07_000023_create_audit_log_table.php`
- `backend/database/migrations/2026_04_07_000024_create_notification_events_table.php`
- `backend/database/migrations/2026_04_07_000025_create_notifications_table.php`
- `backend/app/Models/ScoringCriterion.php`
- `backend/app/Models/HypothesisScoring.php`
- `backend/app/Models/ScoringThresholdConfig.php`
- `backend/app/Models/DeepDiveStage.php`
- `backend/app/Models/HypothesisDeepDive.php`
- `backend/app/Models/HypothesisFile.php`
- `backend/app/Models/Respondent.php`
- `backend/app/Models/RespondentPain.php`
- `backend/app/Models/RespondentArtifact.php`
- `backend/app/Models/Experiment.php`
- `backend/app/Models/ExperimentMetric.php`
- `backend/app/Models/CommitteeMember.php`
- `backend/app/Models/CommitteeVote.php`
- `backend/app/Models/AuditLog.php`
- `backend/app/Models/NotificationEvent.php`
- `backend/app/Models/Notification.php`

**Depends on:** T03
**Complexity:** L
**Risk:** MEDIUM
**Input:** Core tables from T03
**Output:** All content tables created, all Eloquent models with relationships
**Rollback:** `php artisan migrate:rollback --step=16`

#### What to do

1. **scoring_criteria** table:
```php
Schema::create('scoring_criteria', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->string('input_type')->default('slider'); // slider, number, checkbox
    $table->integer('min_value')->default(1);
    $table->integer('max_value')->default(5);
    $table->decimal('weight', 5, 2)->default(1.0);
    $table->boolean('is_active')->default(true);
    $table->jsonb('thresholds')->nullable(); // for number type normalization
    $table->boolean('is_stop_factor')->default(false);
    $table->string('stage')->default('primary'); // 'primary' or 'deep'
    $table->integer('order')->default(0);
    $table->timestamps();
});
```

2. **hypothesis_scorings** table:
```php
Schema::create('hypothesis_scorings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('hypothesis_id')->constrained()->cascadeOnDelete();
    $table->string('stage'); // 'primary' or 'deep'
    $table->jsonb('criteria_scores'); // {criterion_id: score_value}
    $table->decimal('total_score', 5, 2);
    $table->boolean('stop_factor_triggered')->default(false);
    $table->foreignId('scored_by')->constrained('users');
    $table->timestamps();
    $table->unique(['hypothesis_id', 'stage']);
});
```

3. **scoring_threshold_configs** table:
```php
Schema::create('scoring_threshold_configs', function (Blueprint $table) {
    $table->id();
    $table->decimal('primary_threshold', 5, 2)->default(7.0);
    $table->decimal('deep_threshold', 5, 2)->default(7.0);
    $table->timestamps();
});
```

4. **deep_dive_stages** table:
```php
Schema::create('deep_dive_stages', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->integer('order')->default(0);
    $table->boolean('is_required')->default(true);
    $table->string('responsible_role')->default('pd_manager');
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

5. **hypothesis_deep_dives** table:
```php
Schema::create('hypothesis_deep_dives', function (Blueprint $table) {
    $table->id();
    $table->foreignId('hypothesis_id')->constrained()->cascadeOnDelete();
    $table->foreignId('stage_id')->constrained('deep_dive_stages');
    $table->boolean('is_completed')->default(false);
    $table->foreignId('completed_by')->nullable()->constrained('users');
    $table->jsonb('comments')->default('[]');
    $table->timestamp('completed_at')->nullable();
    $table->timestamps();
    $table->unique(['hypothesis_id', 'stage_id']);
});
```

6. **hypothesis_files** table:
```php
Schema::create('hypothesis_files', function (Blueprint $table) {
    $table->id();
    $table->foreignId('hypothesis_id')->constrained()->cascadeOnDelete();
    $table->string('stage')->nullable(); // deep_dive, experiment, general
    $table->string('name');
    $table->string('path');
    $table->string('mime_type')->nullable();
    $table->unsignedBigInteger('size')->default(0);
    $table->foreignId('uploaded_by')->constrained('users');
    $table->timestamps();
});
```

7. **respondents** table:
```php
Schema::create('respondents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('hypothesis_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('company')->nullable();
    $table->string('position')->nullable();
    $table->string('email')->nullable();
    $table->string('phone')->nullable();
    $table->string('contact_source')->nullable();
    $table->string('status')->default('new'); // new, in_contact, scheduled, completed, refused
    $table->timestamp('interview_date')->nullable();
    $table->integer('interview_duration')->nullable();
    $table->foreignId('interviewer_user_id')->nullable()->constrained('users');
    $table->string('interview_format')->nullable(); // zoom, in_person, phone
    $table->string('recording_url')->nullable();
    $table->timestamps();
});
```

8. **respondent_pains**, **respondent_artifacts**: standard FK to respondent, fields as per types.ts.

9. **experiments** table:
```php
Schema::create('experiments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('hypothesis_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->string('type'); // a_b_test, survey, interview, prototype, mvp, other
    $table->string('status')->default('planned'); // planned, running, completed, cancelled
    $table->text('description')->nullable();
    $table->text('what_worked')->nullable();
    $table->text('what_not_worked')->nullable();
    $table->date('start_date')->nullable();
    $table->date('end_date')->nullable();
    $table->string('result')->nullable(); // success, failure, inconclusive
    $table->text('notes')->nullable();
    $table->foreignId('created_by')->constrained('users');
    $table->foreignId('responsible_user_id')->nullable()->constrained('users');
    $table->timestamps();
});
```

10. **experiment_metrics**: FK to experiment, `name`, `target_value`, `actual_value`, `unit`, `result`.

11. **committee_members**: FK to user, `display_role`, `order`, `is_active`.

12. **committee_votes**: FK to hypothesis, FK to committee_member, `vote` (go/no_go/iterate nullable), `comment`, `voted_at`.

13. **audit_log**: `entity_type`, `entity_id`, `action`, `changes` (jsonb), FK to user, timestamps.

14. **notification_events**: `event_type`, `is_active`, `recipients` (jsonb), `template`, `channel`.

15. **notifications**: FK to user, FK to hypothesis (nullable), `type`, `message`, `is_read`, timestamps.

16. Create all corresponding Eloquent models with `$fillable`, `$casts`, and relationships.

#### TDD

**RED phase:**
`backend/tests/Unit/Models/ScoringCriterionTest.php`:
```php
public function test_scoring_criterion_casts_thresholds_to_array(): void
{
    $criterion = ScoringCriterion::factory()->create(['thresholds' => [100, 500, 1000]]);
    $this->assertIsArray($criterion->thresholds);
}
```

`backend/tests/Unit/Models/ExperimentTest.php`:
```php
public function test_experiment_belongs_to_hypothesis(): void
{
    $experiment = Experiment::factory()->create();
    $this->assertInstanceOf(Hypothesis::class, $experiment->hypothesis);
}
```

**GREEN phase:** Implement all migrations and models as described.

#### Verify
```bash
docker compose exec backend php artisan migrate && \
docker compose exec backend php artisan test --filter="ScoringCriterionTest|ExperimentTest"
```

#### Acceptance Criteria
- [ ] `php artisan migrate` creates all 16 new tables
- [ ] All models have factory definitions
- [ ] All relationships work in tinker (e.g. `Hypothesis::first()->experiments`)
- [ ] JSONB fields correctly cast to arrays

---

### Task T05: Database Seeders — Default Data

**Files:**
- `backend/database/seeders/DatabaseSeeder.php`
- `backend/database/seeders/RoleSeeder.php`
- `backend/database/seeders/TeamSeeder.php`
- `backend/database/seeders/UserSeeder.php`
- `backend/database/seeders/StatusTransitionSeeder.php`
- `backend/database/seeders/ScoringCriteriaSeeder.php`
- `backend/database/seeders/ScoringThresholdSeeder.php`
- `backend/database/seeders/DeepDiveStageSeeder.php`
- `backend/database/seeders/SlaConfigSeeder.php`
- `backend/database/seeders/NotificationEventSeeder.php`
- `backend/database/factories/*.php` (all model factories)

**Depends on:** T04
**Complexity:** M
**Risk:** LOW
**Input:** Empty database with all tables from T03 + T04
**Output:** Database populated with default config data and test users
**Rollback:** `php artisan migrate:fresh`

#### What to do

1. **TeamSeeder**: Create 4 teams matching current mock data (Growth, Product, Platform, Mobile).

2. **UserSeeder**: Create test users for each role:
   - `admin@company.com` / admin (password: `password`)
   - `pd@company.com` / pd_manager
   - `analyst@company.com` / analyst
   - `techlead@company.com` / tech_lead
   - `bizdev@company.com` / bizdev
   - `committee@company.com` / committee
   - `initiator@company.com` / initiator

3. **StatusTransitionSeeder**: Default forward path + allowed returns:
   - backlog → scoring (roles: initiator, pd_manager, admin; condition: required_fields — title, problem, solution, target_audience)
   - scoring → deep_dive (roles: pd_manager, analyst, admin; condition: scoring_threshold)
   - deep_dive → experiment (roles: pd_manager, admin; condition: checklist_closed)
   - experiment → go_no_go (roles: pd_manager, admin; condition: none)
   - go_no_go → done (roles: admin; condition: none — triggered by committee vote)
   - go_no_go → archived (roles: admin; condition: none)
   - experiment → deep_dive (roles: pd_manager, admin; condition: none — iterate back)
   - done → archived (roles: admin; condition: none)

4. **ScoringCriteriaSeeder**: Default primary + deep criteria per TZ section 7.3:
   - Primary: TAM (number, thresholds), SOM (number, thresholds), Market potential (slider 1-5), SMG competence fit (slider 1-5), Resource intensity (slider 1-5), Strategic fit (slider 1-5), Stop factors (checkbox, is_stop_factor=true)
   - Deep: Unit economics (slider 1-5), Technical feasibility (slider 1-5), MVP resources (number, thresholds), plus carry-forward primary criteria

5. **ScoringThresholdSeeder**: primary_threshold=7.0, deep_threshold=7.0

6. **DeepDiveStageSeeder**: Default stages per TZ:
   - Market & competitor research
   - Respondent search
   - Interviews (min 3-5)
   - CJM / JBTD
   - Financial model
   - Resource estimation
   - Hypothesis passport

7. **SlaConfigSeeder**: Default SLA per status:
   - backlog: 14 days / warning at 10
   - scoring: 7 days / warning at 5
   - deep_dive: 30 days / warning at 25
   - experiment: 30 days / warning at 25
   - go_no_go: 14 days / warning at 10

8. **NotificationEventSeeder**: Default notification events (all active):
   - status_change, responsible_assigned, committee_decision, sla_warning, sla_violation, committee_voting_opened

9. Create **Model Factories** for all models with sensible defaults.

#### TDD
Skip TDD (seed data). Verify via seeder output.

#### Verify
```bash
docker compose exec backend php artisan migrate:fresh --seed && \
docker compose exec backend php artisan tinker --execute="echo 'Users: '.User::count().', Transitions: '.StatusTransition::count().', Criteria: '.ScoringCriterion::count();"
```

#### Acceptance Criteria
- [ ] `php artisan migrate:fresh --seed` runs without errors
- [ ] 7 users created, one per role
- [ ] 8+ status transitions created
- [ ] 7+ scoring criteria created (primary + deep)
- [ ] 7 deep dive stages created
- [ ] 5 SLA configs created
- [ ] 6+ notification events created

---

### Task T06: Auth API (Laravel Sanctum)

**Files:**
- `backend/app/Http/Controllers/Api/V1/AuthController.php`
- `backend/app/Http/Requests/LoginRequest.php`
- `backend/app/Http/Resources/UserResource.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/Auth/LoginTest.php`
- `backend/tests/Feature/Auth/LogoutTest.php`
- `backend/tests/Feature/Auth/MeTest.php`

**Depends on:** T05
**Complexity:** M
**Risk:** LOW
**Input:** Users table with seeded data, Sanctum configured
**Output:** Working auth endpoints: login, logout, me
**Rollback:** Delete controller, request, resource, revert routes

#### What to do

1. **LoginRequest** (`backend/app/Http/Requests/LoginRequest.php`):
```php
public function rules(): array
{
    return [
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ];
}
```

2. **UserResource** (`backend/app/Http/Resources/UserResource.php`):
```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'email' => $this->email,
        'name' => $this->name,
        'role' => $this->role->value,
        'team_id' => $this->team_id,
        'team' => $this->whenLoaded('team', fn () => [
            'id' => $this->team->id,
            'name' => $this->team->name,
        ]),
        'is_active' => $this->is_active,
        'created_at' => $this->created_at->toIso8601String(),
        'last_login_at' => $this->last_login_at?->toIso8601String(),
    ];
}
```

3. **AuthController**:
```php
// POST /api/v1/auth/login
public function login(LoginRequest $request): JsonResponse
{
    if (! Auth::attempt($request->validated())) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    $user = Auth::user();
    
    if (! $user->is_active) {
        Auth::logout();
        throw ValidationException::withMessages([
            'email' => ['Your account is deactivated.'],
        ]);
    }

    $user->update(['last_login_at' => now()]);
    $request->session()->regenerate();

    return response()->json([
        'user' => new UserResource($user->load('team')),
    ]);
}

// POST /api/v1/auth/logout
public function logout(Request $request): JsonResponse
{
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Logged out']);
}

// GET /api/v1/auth/me
public function me(Request $request): JsonResponse
{
    return response()->json([
        'user' => new UserResource($request->user()->load('team')),
    ]);
}
```

4. **Routes** (`backend/routes/api.php`):
```php
Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]));

    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    });
});
```

#### TDD

**RED phase:**
`backend/tests/Feature/Auth/LoginTest.php`:
```php
public function test_user_can_login_with_valid_credentials(): void
{
    $user = User::factory()->create(['password' => Hash::make('password'), 'is_active' => true]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['user' => ['id', 'email', 'name', 'role']]);
}

public function test_login_fails_with_invalid_credentials(): void
{
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'wrong@test.com',
        'password' => 'wrong',
    ]);

    $response->assertUnprocessable();
}

public function test_inactive_user_cannot_login(): void
{
    $user = User::factory()->create(['password' => Hash::make('password'), 'is_active' => false]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertUnprocessable();
}
```

`backend/tests/Feature/Auth/MeTest.php`:
```php
public function test_authenticated_user_can_get_profile(): void
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/v1/auth/me');

    $response->assertOk()
        ->assertJsonPath('user.id', $user->id);
}

public function test_unauthenticated_user_gets_401(): void
{
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
}
```

**GREEN phase:** Implement controller, request, resource as described above.

#### Verify
```bash
docker compose exec backend php artisan test --filter="LoginTest|LogoutTest|MeTest"
```

#### Acceptance Criteria
- [ ] POST `/api/v1/auth/login` with valid creds returns 200 + user JSON
- [ ] POST `/api/v1/auth/login` with bad creds returns 422
- [ ] POST `/api/v1/auth/login` with inactive user returns 422
- [ ] GET `/api/v1/auth/me` with auth returns user profile
- [ ] GET `/api/v1/auth/me` without auth returns 401
- [ ] POST `/api/v1/auth/logout` invalidates session
- [ ] All 5+ tests pass

---

### Task T07: User & Role Management API (Admin)

**Files:**
- `backend/app/Http/Controllers/Api/V1/Admin/UserController.php`
- `backend/app/Http/Controllers/Api/V1/Admin/TeamController.php`
- `backend/app/Http/Requests/Admin/StoreUserRequest.php`
- `backend/app/Http/Requests/Admin/UpdateUserRequest.php`
- `backend/app/Http/Requests/Admin/StoreTeamRequest.php`
- `backend/app/Http/Requests/Admin/UpdateTeamRequest.php`
- `backend/app/Http/Resources/TeamResource.php`
- `backend/app/Http/Middleware/EnsureAdmin.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/Admin/UserManagementTest.php`
- `backend/tests/Feature/Admin/TeamManagementTest.php`

**Depends on:** T06
**Complexity:** M
**Risk:** LOW
**Input:** Auth API working, users/teams tables
**Output:** Full CRUD for users and teams, admin-only middleware
**Rollback:** Delete new files, revert routes

#### What to do

1. **EnsureAdmin middleware** — checks `$request->user()->role === UserRole::Admin`, returns 403 otherwise.

2. **UserController** endpoints:
   - `GET /api/v1/admin/users` — paginated list, filter by role/team/is_active, search by name/email
   - `POST /api/v1/admin/users` — create user (name, email, password, role, team_id, is_active)
   - `GET /api/v1/admin/users/{id}` — single user detail
   - `PUT /api/v1/admin/users/{id}` — update user (role, team, is_active, name)
   - `PATCH /api/v1/admin/users/{id}/toggle-active` — quick activate/deactivate

3. **TeamController** endpoints:
   - `GET /api/v1/admin/teams` — list all teams with member_count
   - `POST /api/v1/admin/teams` — create team
   - `PUT /api/v1/admin/teams/{id}` — update team
   - `DELETE /api/v1/admin/teams/{id}` — delete team (only if no users assigned)

4. **Routes**: group under `admin` prefix with `auth:sanctum` + `EnsureAdmin` middleware.

5. **Validation Requests**:
   - StoreUserRequest: email unique, role in UserRole values, password min 8
   - UpdateUserRequest: email unique ignoring current, role in UserRole values
   - StoreTeamRequest: name required, unique
   - UpdateTeamRequest: name unique ignoring current

#### TDD

**RED phase:**
`backend/tests/Feature/Admin/UserManagementTest.php`:
```php
public function test_admin_can_list_users(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    User::factory()->count(5)->create();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/users');
    $response->assertOk()->assertJsonStructure(['data', 'meta']);
}

public function test_non_admin_cannot_access_user_management(): void
{
    $user = User::factory()->create(['role' => UserRole::Initiator]);
    $response = $this->actingAs($user)->getJson('/api/v1/admin/users');
    $response->assertForbidden();
}

public function test_admin_can_create_user(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $response = $this->actingAs($admin)->postJson('/api/v1/admin/users', [
        'name' => 'New User',
        'email' => 'new@company.com',
        'password' => 'password123',
        'role' => 'initiator',
        'team_id' => Team::factory()->create()->id,
    ]);
    $response->assertCreated();
}

public function test_admin_can_toggle_user_active(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $user = User::factory()->create(['is_active' => true]);
    
    $response = $this->actingAs($admin)->patchJson("/api/v1/admin/users/{$user->id}/toggle-active");
    $response->assertOk();
    $this->assertFalse($user->fresh()->is_active);
}
```

**GREEN phase:** Implement controllers, middleware, requests as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter="UserManagementTest|TeamManagementTest"
```

#### Acceptance Criteria
- [ ] Admin can list, create, update, deactivate users
- [ ] Non-admin gets 403 on all admin endpoints
- [ ] User creation validates unique email
- [ ] Team deletion blocked when team has users
- [ ] Pagination works on user list
- [ ] All 6+ tests pass

---

### Task T08: Hypothesis CRUD API

**Files:**
- `backend/app/Http/Controllers/Api/V1/HypothesisController.php`
- `backend/app/Http/Requests/StoreHypothesisRequest.php`
- `backend/app/Http/Requests/UpdateHypothesisRequest.php`
- `backend/app/Http/Resources/HypothesisResource.php`
- `backend/app/Http/Resources/HypothesisListResource.php`
- `backend/app/Services/HypothesisCodeGenerator.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/Hypothesis/HypothesisCrudTest.php`

**Depends on:** T06
**Complexity:** M
**Risk:** LOW
**Input:** Auth API, hypotheses table, users
**Output:** CRUD endpoints for hypotheses with filtering, search, pagination
**Rollback:** Delete new files, revert routes

#### What to do

1. **HypothesisCodeGenerator** service:
```php
class HypothesisCodeGenerator
{
    public function generate(): string
    {
        $lastCode = Hypothesis::query()
            ->orderByDesc('id')
            ->value('code');

        $nextNumber = $lastCode
            ? (int) str_replace('HYP-', '', $lastCode) + 1
            : 1;

        return sprintf('HYP-%03d', $nextNumber);
    }
}
```

2. **HypothesisController** endpoints:
   - `GET /api/v1/hypotheses` — paginated list with filters (status, team_id, initiator_id, owner_id, priority, search), sortable by created_at, updated_at, scoring_primary, status
   - `POST /api/v1/hypotheses` — create (title, description, problem, solution, assumptions, target_audience, team_id, priority). Sets `initiator_id` to authenticated user, generates code, status=backlog
   - `GET /api/v1/hypotheses/{id}` — full detail with loaded relations (initiator, owner, team, scoring, deepDive stages, experiments, votes, statusHistory)
   - `PUT /api/v1/hypotheses/{id}` — update editable fields (title, description, problem, solution, assumptions, target_audience, priority, owner_id)
   - `DELETE /api/v1/hypotheses/{id}` — soft-delete or hard-delete (admin only)

3. **HypothesisListResource** — lightweight for list view: id, code, title, status, priority, initiator (name), owner (name), team (name), scoring_primary, scoring_deep, sla_deadline, sla_status, created_at, updated_at.

4. **HypothesisResource** — full resource with all nested data.

5. **StoreHypothesisRequest**:
   - title: required, string, max 255
   - description: nullable, string
   - problem: nullable, string
   - solution: nullable, string
   - assumptions: nullable, string
   - target_audience: nullable, string
   - team_id: nullable, exists:teams,id
   - priority: nullable, in:low,medium,high

6. **Routes**: `Route::apiResource('hypotheses', HypothesisController::class)` inside auth:sanctum group.

#### TDD

**RED phase:**
`backend/tests/Feature/Hypothesis/HypothesisCrudTest.php`:
```php
public function test_authenticated_user_can_list_hypotheses(): void
{
    $user = User::factory()->create();
    Hypothesis::factory()->count(3)->create();

    $response = $this->actingAs($user)->getJson('/api/v1/hypotheses');
    $response->assertOk()->assertJsonCount(3, 'data');
}

public function test_user_can_create_hypothesis(): void
{
    $user = User::factory()->create(['role' => UserRole::Initiator]);
    
    $response = $this->actingAs($user)->postJson('/api/v1/hypotheses', [
        'title' => 'Test hypothesis',
        'description' => 'Test description',
        'problem' => 'Test problem',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'backlog')
        ->assertJsonPath('data.initiator.id', $user->id);
    
    $this->assertStringStartsWith('HYP-', $response->json('data.code'));
}

public function test_hypothesis_code_auto_increments(): void
{
    $user = User::factory()->create();
    Hypothesis::factory()->create(['code' => 'HYP-005']);
    
    $response = $this->actingAs($user)->postJson('/api/v1/hypotheses', [
        'title' => 'Next hypothesis',
    ]);

    $response->assertCreated()->assertJsonPath('data.code', 'HYP-006');
}

public function test_hypotheses_can_be_filtered_by_status(): void
{
    $user = User::factory()->create();
    Hypothesis::factory()->count(2)->create(['status' => HypothesisStatus::Backlog]);
    Hypothesis::factory()->count(3)->create(['status' => HypothesisStatus::Scoring]);

    $response = $this->actingAs($user)->getJson('/api/v1/hypotheses?status=backlog');
    $response->assertOk()->assertJsonCount(2, 'data');
}

public function test_unauthenticated_user_cannot_access_hypotheses(): void
{
    $this->getJson('/api/v1/hypotheses')->assertUnauthorized();
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=HypothesisCrudTest
```

#### Acceptance Criteria
- [ ] Authenticated user can list hypotheses with pagination
- [ ] Creating hypothesis auto-generates HYP-NNN code
- [ ] Initiator is set from authenticated user
- [ ] Status filter, search, sorting work
- [ ] Full detail endpoint loads nested relations
- [ ] All 5+ tests pass

---

### Task T09: Status Machine Service + Status Transition API

**Files:**
- `backend/app/Services/StatusMachineService.php`
- `backend/app/Http/Controllers/Api/V1/HypothesisStatusController.php`
- `backend/app/Http/Requests/ChangeStatusRequest.php`
- `backend/app/Events/HypothesisStatusChanged.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Unit/Services/StatusMachineServiceTest.php`
- `backend/tests/Feature/Hypothesis/StatusTransitionTest.php`

**Depends on:** T08
**Complexity:** L
**Risk:** HIGH
**Input:** Hypotheses, status_transitions table with seeded data, scoring data
**Output:** Configurable status machine that enforces transition rules from DB
**Rollback:** Delete new files, revert routes

#### What to do

1. **StatusMachineService**:
```php
class StatusMachineService
{
    /**
     * Get available transitions for a hypothesis given the current user.
     */
    public function getAvailableTransitions(Hypothesis $hypothesis, User $user): Collection
    {
        return StatusTransition::query()
            ->where('from_status', $hypothesis->status->value)
            ->where('is_active', true)
            ->get()
            ->filter(fn (StatusTransition $t) => $this->isRoleAllowed($t, $user))
            ->filter(fn (StatusTransition $t) => $this->isConditionMet($t, $hypothesis));
    }

    /**
     * Execute a status transition.
     * @throws \DomainException if transition is not allowed
     */
    public function transition(Hypothesis $hypothesis, HypothesisStatus $toStatus, User $user, ?string $comment = null): Hypothesis
    {
        $transition = StatusTransition::query()
            ->where('from_status', $hypothesis->status->value)
            ->where('to_status', $toStatus->value)
            ->where('is_active', true)
            ->first();

        if (! $transition) {
            throw new \DomainException("Transition from {$hypothesis->status->value} to {$toStatus->value} is not configured.");
        }

        if (! $this->isRoleAllowed($transition, $user)) {
            throw new \DomainException("User role {$user->role->value} is not allowed for this transition.");
        }

        if (! $this->isConditionMet($transition, $hypothesis)) {
            throw new \DomainException("Transition condition not met: {$transition->condition_type}");
        }

        $fromStatus = $hypothesis->status;

        $hypothesis->update([
            'status' => $toStatus,
            'sla_deadline' => $this->calculateSlaDeadline($toStatus),
            'sla_status' => 'ok',
        ]);

        HypothesisStatusHistory::create([
            'hypothesis_id' => $hypothesis->id,
            'from_status' => $fromStatus->value,
            'to_status' => $toStatus->value,
            'changed_by' => $user->id,
            'comment' => $comment,
        ]);

        event(new HypothesisStatusChanged($hypothesis, $fromStatus, $toStatus, $user));

        return $hypothesis->fresh();
    }

    private function isRoleAllowed(StatusTransition $transition, User $user): bool
    {
        $allowedRoles = $transition->allowed_roles ?? [];
        return in_array($user->role->value, $allowedRoles) || $user->role === UserRole::Admin;
    }

    private function isConditionMet(StatusTransition $transition, Hypothesis $hypothesis): bool
    {
        return match ($transition->condition_type) {
            'none' => true,
            'required_fields' => $this->checkRequiredFields($hypothesis, $transition->condition_value),
            'scoring_threshold' => $this->checkScoringThreshold($hypothesis, $transition),
            'checklist_closed' => $this->checkChecklistClosed($hypothesis),
            default => true,
        };
    }

    private function checkRequiredFields(Hypothesis $hypothesis, ?string $fieldList): bool
    {
        if (! $fieldList) return true;
        $fields = explode(',', $fieldList);
        foreach ($fields as $field) {
            if (empty($hypothesis->{trim($field)})) return false;
        }
        return true;
    }

    private function checkScoringThreshold(Hypothesis $hypothesis, StatusTransition $transition): bool
    {
        $config = ScoringThresholdConfig::first();
        if (! $config) return true;

        // If transitioning from scoring to deep_dive, check primary threshold
        if ($transition->to_status === 'deep_dive') {
            return $hypothesis->scoring_primary !== null
                && $hypothesis->scoring_primary >= $config->primary_threshold;
        }
        // If transitioning from deep_dive, check deep threshold
        if ($transition->from_status === 'deep_dive') {
            return $hypothesis->scoring_deep !== null
                && $hypothesis->scoring_deep >= $config->deep_threshold;
        }
        return true;
    }

    private function checkChecklistClosed(Hypothesis $hypothesis): bool
    {
        $requiredStages = DeepDiveStage::where('is_active', true)->where('is_required', true)->count();
        $completedStages = HypothesisDeepDive::where('hypothesis_id', $hypothesis->id)
            ->where('is_completed', true)
            ->count();
        return $completedStages >= $requiredStages;
    }

    private function calculateSlaDeadline(HypothesisStatus $status): ?string
    {
        $sla = SlaConfig::where('status', $status->value)->where('is_active', true)->first();
        return $sla ? now()->addDays($sla->limit_days)->toDateTimeString() : null;
    }
}
```

2. **HypothesisStatusController**:
   - `GET /api/v1/hypotheses/{id}/transitions` — returns available transitions for current user
   - `POST /api/v1/hypotheses/{id}/transition` — execute transition (body: `to_status`, `comment`)

3. **HypothesisStatusChanged** event — dispatched on transition, will be consumed by audit and notification listeners (implemented in later tasks).

4. **ChangeStatusRequest**: validates `to_status` exists in HypothesisStatus enum, `comment` is optional string.

#### TDD

**RED phase:**
`backend/tests/Unit/Services/StatusMachineServiceTest.php`:
```php
public function test_can_transition_on_valid_path(): void
{
    // Seed a backlog→scoring transition
    StatusTransition::factory()->create([
        'from_status' => 'backlog',
        'to_status' => 'scoring',
        'allowed_roles' => ['initiator', 'admin'],
        'condition_type' => 'none',
    ]);
    
    $user = User::factory()->create(['role' => UserRole::Initiator]);
    $hypothesis = Hypothesis::factory()->create(['status' => HypothesisStatus::Backlog]);
    
    $service = new StatusMachineService();
    $result = $service->transition($hypothesis, HypothesisStatus::Scoring, $user);
    
    $this->assertEquals(HypothesisStatus::Scoring, $result->status);
}

public function test_transition_denied_for_wrong_role(): void
{
    StatusTransition::factory()->create([
        'from_status' => 'backlog',
        'to_status' => 'scoring',
        'allowed_roles' => ['pd_manager'],
        'condition_type' => 'none',
    ]);
    
    $user = User::factory()->create(['role' => UserRole::Committee]);
    $hypothesis = Hypothesis::factory()->create(['status' => HypothesisStatus::Backlog]);
    
    $this->expectException(\DomainException::class);
    (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Scoring, $user);
}

public function test_transition_denied_when_scoring_threshold_not_met(): void
{
    StatusTransition::factory()->create([
        'from_status' => 'scoring',
        'to_status' => 'deep_dive',
        'allowed_roles' => ['pd_manager'],
        'condition_type' => 'scoring_threshold',
    ]);
    ScoringThresholdConfig::create(['primary_threshold' => 7.0, 'deep_threshold' => 7.0]);
    
    $user = User::factory()->create(['role' => UserRole::PdManager]);
    $hypothesis = Hypothesis::factory()->create([
        'status' => HypothesisStatus::Scoring,
        'scoring_primary' => 5.0,
    ]);
    
    $this->expectException(\DomainException::class);
    (new StatusMachineService())->transition($hypothesis, HypothesisStatus::DeepDive, $user);
}

public function test_status_history_recorded_on_transition(): void
{
    StatusTransition::factory()->create([
        'from_status' => 'backlog',
        'to_status' => 'scoring',
        'allowed_roles' => ['admin'],
        'condition_type' => 'none',
    ]);
    
    $user = User::factory()->create(['role' => UserRole::Admin]);
    $hypothesis = Hypothesis::factory()->create(['status' => HypothesisStatus::Backlog]);
    
    (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Scoring, $user, 'Moving to scoring');
    
    $this->assertDatabaseHas('hypothesis_status_history', [
        'hypothesis_id' => $hypothesis->id,
        'from_status' => 'backlog',
        'to_status' => 'scoring',
        'comment' => 'Moving to scoring',
    ]);
}
```

**GREEN phase:** Implement StatusMachineService, controller, event as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter="StatusMachineServiceTest|StatusTransitionTest"
```

#### Acceptance Criteria
- [ ] Valid transitions succeed and update hypothesis status
- [ ] Invalid role transitions throw DomainException / return 403
- [ ] Unmet conditions (required_fields, scoring_threshold, checklist) block transition
- [ ] Status history record created on each transition
- [ ] SLA deadline auto-calculated from sla_configs
- [ ] HypothesisStatusChanged event dispatched
- [ ] All 6+ tests pass

**Fallback approach:** If the DB-driven transition config proves too complex for initial implementation, fall back to a hardcoded transition map in the service class and migrate to DB-driven in a follow-up task.

---

### Task T10: Scoring Module API

**Files:**
- `backend/app/Http/Controllers/Api/V1/ScoringController.php`
- `backend/app/Services/ScoringCalculator.php`
- `backend/app/Http/Requests/SubmitScoringRequest.php`
- `backend/app/Http/Resources/ScoringResource.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Unit/Services/ScoringCalculatorTest.php`
- `backend/tests/Feature/Hypothesis/ScoringTest.php`

**Depends on:** T08, T04
**Complexity:** M
**Risk:** MEDIUM
**Input:** Hypothesis, scoring_criteria, scoring_threshold_configs
**Output:** Scoring submission and auto-calculation endpoints
**Rollback:** Delete new files, revert routes

#### What to do

1. **ScoringCalculator** service:
```php
class ScoringCalculator
{
    /**
     * Calculate weighted score from criteria scores.
     * @param array<int, float> $criteriaScores — [criterion_id => raw_score]
     * @param string $stage — 'primary' or 'deep'
     * @return array{total_score: float, stop_factor_triggered: bool}
     */
    public function calculate(array $criteriaScores, string $stage): array
    {
        $criteria = ScoringCriterion::where('stage', $stage)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $stopFactorTriggered = false;
        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($criteriaScores as $criterionId => $rawScore) {
            $criterion = $criteria->get($criterionId);
            if (! $criterion) continue;

            if ($criterion->is_stop_factor && $rawScore > 0) {
                $stopFactorTriggered = true;
            }

            if (! $criterion->is_stop_factor) {
                $normalized = $this->normalize($rawScore, $criterion);
                $weightedSum += $normalized * $criterion->weight;
                $totalWeight += $criterion->weight;
            }
        }

        $totalScore = $totalWeight > 0 ? round($weightedSum / $totalWeight, 2) : 0;

        return [
            'total_score' => $totalScore,
            'stop_factor_triggered' => $stopFactorTriggered,
        ];
    }

    private function normalize(float $rawScore, ScoringCriterion $criterion): float
    {
        if ($criterion->input_type === 'number' && ! empty($criterion->thresholds)) {
            // Map raw number to 1-5 scale based on thresholds
            $thresholds = $criterion->thresholds;
            sort($thresholds);
            $level = 1;
            foreach ($thresholds as $t) {
                if ($rawScore >= $t) $level++;
            }
            return min($level, 5);
        }
        // slider/number without thresholds — already on criterion scale, normalize to 1-5
        return max(1, min(5, $rawScore));
    }
}
```

2. **ScoringController**:
   - `GET /api/v1/hypotheses/{id}/scoring/{stage}` — get current scoring for stage (primary/deep)
   - `POST /api/v1/hypotheses/{id}/scoring/{stage}` — submit scoring (body: `criteria_scores` object)
   - `GET /api/v1/scoring-criteria?stage=primary` — list active criteria for a stage

3. On submit: calculate total, save to hypothesis_scorings, update `hypothesis.scoring_primary` or `hypothesis.scoring_deep` with total_score.

#### TDD

**RED phase:**
`backend/tests/Unit/Services/ScoringCalculatorTest.php`:
```php
public function test_calculates_weighted_average(): void
{
    ScoringCriterion::factory()->create(['id' => 1, 'stage' => 'primary', 'weight' => 2.0, 'is_stop_factor' => false, 'input_type' => 'slider']);
    ScoringCriterion::factory()->create(['id' => 2, 'stage' => 'primary', 'weight' => 1.0, 'is_stop_factor' => false, 'input_type' => 'slider']);

    $result = (new ScoringCalculator())->calculate([1 => 4, 2 => 2], 'primary');

    // (4*2 + 2*1) / (2+1) = 10/3 = 3.33
    $this->assertEquals(3.33, $result['total_score']);
    $this->assertFalse($result['stop_factor_triggered']);
}

public function test_stop_factor_detected(): void
{
    ScoringCriterion::factory()->create(['id' => 1, 'stage' => 'primary', 'weight' => 1.0, 'is_stop_factor' => false, 'input_type' => 'slider']);
    ScoringCriterion::factory()->create(['id' => 2, 'stage' => 'primary', 'weight' => 0, 'is_stop_factor' => true, 'input_type' => 'checkbox']);

    $result = (new ScoringCalculator())->calculate([1 => 4, 2 => 1], 'primary');

    $this->assertTrue($result['stop_factor_triggered']);
}

public function test_number_type_normalization_with_thresholds(): void
{
    ScoringCriterion::factory()->create([
        'id' => 1, 'stage' => 'primary', 'weight' => 1.0,
        'is_stop_factor' => false, 'input_type' => 'number',
        'thresholds' => [100, 500, 1000, 5000],
    ]);

    $result = (new ScoringCalculator())->calculate([1 => 600], 'primary');
    // 600 >= 100 (+1), >= 500 (+1) → level=3
    $this->assertEquals(3.0, $result['total_score']);
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter="ScoringCalculatorTest|ScoringTest"
```

#### Acceptance Criteria
- [ ] Weighted average calculation is correct
- [ ] Stop factors detected and flagged
- [ ] Number-type criteria normalized via thresholds
- [ ] Scoring saved to DB and hypothesis.scoring_primary/deep updated
- [ ] Criteria list endpoint returns active criteria for given stage
- [ ] All 5+ tests pass

---

### Task T11: Deep Dive API

**Files:**
- `backend/app/Http/Controllers/Api/V1/DeepDiveController.php`
- `backend/app/Http/Requests/UpdateDeepDiveStageRequest.php`
- `backend/app/Http/Resources/DeepDiveResource.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/Hypothesis/DeepDiveTest.php`

**Depends on:** T08, T04
**Complexity:** M
**Risk:** LOW
**Input:** Hypotheses, deep_dive_stages, hypothesis_deep_dives tables
**Output:** API to manage deep dive checklist per hypothesis
**Rollback:** Delete new files, revert routes

#### What to do

1. **DeepDiveController**:
   - `GET /api/v1/hypotheses/{id}/deep-dive` — returns all deep dive stages for hypothesis with completion status. For each stage from `deep_dive_stages`, joins with `hypothesis_deep_dives` to show `is_completed`, `completed_by`, `comments`.
   - `PUT /api/v1/hypotheses/{id}/deep-dive/{stageId}` — update a stage (toggle `is_completed`, add comment). If marking as completed, set `completed_by` and `completed_at`.
   - `POST /api/v1/hypotheses/{id}/deep-dive/{stageId}/comments` — add comment to stage (body: `text`)
   - `GET /api/v1/hypotheses/{id}/deep-dive/progress` — returns `{ total: N, completed: M, required_total: X, required_completed: Y }`

2. When a stage is toggled to `is_completed=true`, upsert into `hypothesis_deep_dives`.

3. Progress endpoint used by status machine to verify checklist completion.

#### TDD

**RED phase:**
```php
public function test_can_get_deep_dive_stages_for_hypothesis(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();
    DeepDiveStage::factory()->count(5)->create();

    $response = $this->actingAs($user)->getJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive");
    $response->assertOk()->assertJsonCount(5, 'data');
}

public function test_can_complete_a_deep_dive_stage(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();
    $stage = DeepDiveStage::factory()->create();

    $response = $this->actingAs($user)->putJson(
        "/api/v1/hypotheses/{$hypothesis->id}/deep-dive/{$stage->id}",
        ['is_completed' => true]
    );

    $response->assertOk();
    $this->assertDatabaseHas('hypothesis_deep_dives', [
        'hypothesis_id' => $hypothesis->id,
        'stage_id' => $stage->id,
        'is_completed' => true,
    ]);
}

public function test_progress_endpoint_returns_correct_counts(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();
    $stage1 = DeepDiveStage::factory()->create(['is_required' => true]);
    $stage2 = DeepDiveStage::factory()->create(['is_required' => true]);
    $stage3 = DeepDiveStage::factory()->create(['is_required' => false]);
    
    HypothesisDeepDive::create([
        'hypothesis_id' => $hypothesis->id,
        'stage_id' => $stage1->id,
        'is_completed' => true,
        'completed_by' => $user->id,
    ]);

    $response = $this->actingAs($user)->getJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/progress");
    $response->assertOk()->assertJson([
        'total' => 3,
        'completed' => 1,
        'required_total' => 2,
        'required_completed' => 1,
    ]);
}
```

**GREEN phase:** Implement controller as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=DeepDiveTest
```

#### Acceptance Criteria
- [ ] All configured stages returned per hypothesis
- [ ] Stages can be toggled completed/uncompleted
- [ ] Comments can be added to stages
- [ ] Progress endpoint returns accurate counts
- [ ] All 3+ tests pass

---

### Task T12: Respondent CRM API

**Files:**
- `backend/app/Http/Controllers/Api/V1/RespondentController.php`
- `backend/app/Http/Requests/StoreRespondentRequest.php`
- `backend/app/Http/Requests/UpdateRespondentRequest.php`
- `backend/app/Http/Resources/RespondentResource.php`
- `backend/app/Http/Resources/PainSummaryResource.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/Hypothesis/RespondentTest.php`

**Depends on:** T08, T04
**Complexity:** M
**Risk:** LOW
**Input:** respondents, respondent_pains, respondent_artifacts tables
**Output:** CRUD for respondents per hypothesis, pain tag aggregation
**Rollback:** Delete new files, revert routes

#### What to do

1. **RespondentController**:
   - `GET /api/v1/hypotheses/{id}/respondents` — list with filters (status), includes pains count
   - `POST /api/v1/hypotheses/{id}/respondents` — create respondent
   - `PUT /api/v1/hypotheses/{hypothesisId}/respondents/{respondentId}` — update
   - `DELETE /api/v1/hypotheses/{hypothesisId}/respondents/{respondentId}` — delete
   - `POST /api/v1/respondents/{id}/pains` — add pain (tag, quote)
   - `DELETE /api/v1/respondents/{id}/pains/{painId}` — remove pain
   - `GET /api/v1/hypotheses/{id}/pain-summary` — aggregated pains: `[{tag, count, respondent_names}]`

2. **StoreRespondentRequest**: name required, email optional (validate format if present), status in allowed values.

3. **PainSummaryResource**: Groups pains by tag, counts occurrences, lists respondent names.

#### TDD

**RED phase:**
```php
public function test_can_create_respondent(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();

    $response = $this->actingAs($user)->postJson("/api/v1/hypotheses/{$hypothesis->id}/respondents", [
        'name' => 'John Doe',
        'company' => 'ACME',
        'position' => 'CTO',
        'contact_source' => 'LinkedIn',
    ]);

    $response->assertCreated();
}

public function test_pain_summary_aggregates_correctly(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();
    $r1 = Respondent::factory()->create(['hypothesis_id' => $hypothesis->id, 'name' => 'Alice']);
    $r2 = Respondent::factory()->create(['hypothesis_id' => $hypothesis->id, 'name' => 'Bob']);
    
    RespondentPain::factory()->create(['respondent_id' => $r1->id, 'tag' => 'slow_onboarding']);
    RespondentPain::factory()->create(['respondent_id' => $r2->id, 'tag' => 'slow_onboarding']);
    RespondentPain::factory()->create(['respondent_id' => $r1->id, 'tag' => 'pricing']);

    $response = $this->actingAs($user)->getJson("/api/v1/hypotheses/{$hypothesis->id}/pain-summary");
    $response->assertOk();
    
    $data = $response->json('data');
    $slowOnboarding = collect($data)->firstWhere('tag', 'slow_onboarding');
    $this->assertEquals(2, $slowOnboarding['count']);
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=RespondentTest
```

#### Acceptance Criteria
- [ ] CRUD for respondents works
- [ ] Pains can be added/removed per respondent
- [ ] Pain summary correctly aggregates by tag
- [ ] All 3+ tests pass

---

### Task T13: Experiments API

**Files:**
- `backend/app/Http/Controllers/Api/V1/ExperimentController.php`
- `backend/app/Http/Requests/StoreExperimentRequest.php`
- `backend/app/Http/Requests/UpdateExperimentRequest.php`
- `backend/app/Http/Resources/ExperimentResource.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/Hypothesis/ExperimentTest.php`

**Depends on:** T08, T04
**Complexity:** M
**Risk:** LOW
**Input:** experiments, experiment_metrics tables
**Output:** CRUD for experiments per hypothesis with metrics management
**Rollback:** Delete new files, revert routes

#### What to do

1. **ExperimentController**:
   - `GET /api/v1/hypotheses/{id}/experiments` — list with metrics loaded
   - `POST /api/v1/hypotheses/{id}/experiments` — create experiment (title, type, description, start_date, end_date, metrics[])
   - `PUT /api/v1/hypotheses/{hypothesisId}/experiments/{experimentId}` — update experiment + metrics (sync)
   - `DELETE /api/v1/hypotheses/{hypothesisId}/experiments/{experimentId}` — delete
   - `PATCH /api/v1/experiments/{id}/result` — set result (result, what_worked, what_not_worked)

2. On create/update, handle metrics as nested array: delete removed metrics, create new, update existing (sync by ID or full replace).

3. **StoreExperimentRequest**: title required, type in allowed enum values, metrics is array of objects with name required.

#### TDD

**RED phase:**
```php
public function test_can_create_experiment_with_metrics(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();

    $response = $this->actingAs($user)->postJson("/api/v1/hypotheses/{$hypothesis->id}/experiments", [
        'title' => 'Landing page test',
        'type' => 'a_b_test',
        'description' => 'Test conversion',
        'start_date' => '2026-04-10',
        'end_date' => '2026-04-20',
        'metrics' => [
            ['name' => 'Conversion rate', 'target_value' => '5%', 'unit' => '%'],
            ['name' => 'Signups', 'target_value' => '100', 'unit' => 'шт'],
        ],
    ]);

    $response->assertCreated();
    $this->assertCount(2, $response->json('data.metrics'));
}

public function test_can_update_experiment_result(): void
{
    $user = User::factory()->create();
    $experiment = Experiment::factory()->create();

    $response = $this->actingAs($user)->patchJson("/api/v1/experiments/{$experiment->id}/result", [
        'result' => 'success',
        'what_worked' => 'High conversion on variant B',
        'what_not_worked' => 'Low retention after signup',
    ]);

    $response->assertOk();
    $this->assertEquals('success', $experiment->fresh()->result);
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=ExperimentTest
```

#### Acceptance Criteria
- [ ] CRUD for experiments works
- [ ] Metrics created/updated with experiment
- [ ] Result can be set separately
- [ ] All 3+ tests pass

---

### Task T14: Committee Voting API

**Files:**
- `backend/app/Http/Controllers/Api/V1/CommitteeController.php`
- `backend/app/Services/CommitteeDecisionService.php`
- `backend/app/Http/Requests/CastVoteRequest.php`
- `backend/app/Http/Resources/CommitteeVoteResource.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/Hypothesis/CommitteeVotingTest.php`

**Depends on:** T08, T09, T04
**Complexity:** M
**Risk:** MEDIUM
**Input:** committee_members, committee_votes tables, status machine
**Output:** Voting endpoints + auto-decision logic
**Rollback:** Delete new files, revert routes

#### What to do

1. **CommitteeController**:
   - `GET /api/v1/hypotheses/{id}/votes` — returns all active committee members with their votes for this hypothesis
   - `POST /api/v1/hypotheses/{id}/votes` — cast vote (body: `vote` (go/no_go/iterate), `comment`). Only committee members can vote. Creates/updates vote for the authenticated user's committee membership.
   - `POST /api/v1/hypotheses/{id}/finalize-decision` — admin/pd_manager triggers final decision calculation

2. **CommitteeDecisionService**:
   - Takes all votes for a hypothesis
   - Majority wins: if >50% go → auto-transition to `done`; if >50% no_go → auto-transition to `archived`; if >50% iterate → transition to appropriate previous status
   - Records decision in hypothesis (`decision` field or separate table — for MVP, store in status history comment)
   - Uses StatusMachineService for transition (bypasses normal condition checks for committee decisions — admin override)

3. **CastVoteRequest**: vote required, in [go, no_go, iterate], comment optional.

4. Admin endpoints for committee member management:
   - `GET /api/v1/admin/committee-members` — list
   - `POST /api/v1/admin/committee-members` — add (user_id, display_role, order)
   - `PUT /api/v1/admin/committee-members/{id}` — update
   - `DELETE /api/v1/admin/committee-members/{id}` — remove

#### TDD

**RED phase:**
```php
public function test_committee_member_can_vote(): void
{
    $user = User::factory()->create(['role' => UserRole::Committee]);
    $member = CommitteeMember::factory()->create(['user_id' => $user->id, 'is_active' => true]);
    $hypothesis = Hypothesis::factory()->create(['status' => HypothesisStatus::GoNoGo]);

    $response = $this->actingAs($user)->postJson("/api/v1/hypotheses/{$hypothesis->id}/votes", [
        'vote' => 'go',
        'comment' => 'Looks promising',
    ]);

    $response->assertCreated();
    $this->assertDatabaseHas('committee_votes', [
        'hypothesis_id' => $hypothesis->id,
        'member_id' => $member->id,
        'vote' => 'go',
    ]);
}

public function test_non_committee_member_cannot_vote(): void
{
    $user = User::factory()->create(['role' => UserRole::Initiator]);
    $hypothesis = Hypothesis::factory()->create(['status' => HypothesisStatus::GoNoGo]);

    $response = $this->actingAs($user)->postJson("/api/v1/hypotheses/{$hypothesis->id}/votes", [
        'vote' => 'go',
    ]);

    $response->assertForbidden();
}

public function test_finalize_decision_transitions_on_majority_go(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $hypothesis = Hypothesis::factory()->create(['status' => HypothesisStatus::GoNoGo]);
    
    // Create 3 committee members, 2 vote go, 1 votes no_go
    $members = CommitteeMember::factory()->count(3)->create(['is_active' => true]);
    CommitteeVote::factory()->create(['hypothesis_id' => $hypothesis->id, 'member_id' => $members[0]->id, 'vote' => 'go']);
    CommitteeVote::factory()->create(['hypothesis_id' => $hypothesis->id, 'member_id' => $members[1]->id, 'vote' => 'go']);
    CommitteeVote::factory()->create(['hypothesis_id' => $hypothesis->id, 'member_id' => $members[2]->id, 'vote' => 'no_go']);
    
    // Need transition config for go_no_go → done
    StatusTransition::factory()->create(['from_status' => 'go_no_go', 'to_status' => 'done', 'allowed_roles' => ['admin'], 'condition_type' => 'none']);

    $response = $this->actingAs($admin)->postJson("/api/v1/hypotheses/{$hypothesis->id}/finalize-decision");
    
    $response->assertOk();
    $this->assertEquals(HypothesisStatus::Done, $hypothesis->fresh()->status);
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=CommitteeVotingTest
```

#### Acceptance Criteria
- [ ] Committee members can cast votes (go/no_go/iterate)
- [ ] Non-committee users cannot vote
- [ ] Vote can be updated (re-vote)
- [ ] Finalize decision calculates majority and transitions hypothesis
- [ ] Admin can manage committee members
- [ ] All 4+ tests pass

---

### Task T15: Audit Log System

**Files:**
- `backend/app/Services/AuditLogger.php`
- `backend/app/Listeners/LogHypothesisStatusChange.php`
- `backend/app/Observers/HypothesisObserver.php`
- `backend/app/Observers/ExperimentObserver.php`
- `backend/app/Http/Controllers/Api/V1/AuditLogController.php`
- `backend/app/Http/Resources/AuditLogResource.php`
- `backend/app/Providers/EventServiceProvider.php` (modify or use AppServiceProvider)
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/AuditLogTest.php`

**Depends on:** T08, T09
**Complexity:** M
**Risk:** LOW
**Input:** audit_log table, events system
**Output:** Automatic audit logging for all entity changes, query endpoint
**Rollback:** Delete new files, revert routes, remove observer registrations

#### What to do

1. **AuditLogger** service:
```php
class AuditLogger
{
    public function log(string $entityType, int $entityId, string $action, array $changes = [], ?int $userId = null): void
    {
        AuditLog::create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'changes' => $changes,
            'user_id' => $userId ?? auth()->id(),
        ]);
    }
}
```

2. **HypothesisObserver**: on `created`, `updated`, `deleted` — call AuditLogger with old/new values diff.

3. **ExperimentObserver**: same pattern.

4. **LogHypothesisStatusChange** listener: listens to `HypothesisStatusChanged` event, logs with from/to status.

5. Register observers in `AppServiceProvider::boot()`.

6. **AuditLogController**:
   - `GET /api/v1/audit-log` — paginated, filterable by entity_type, entity_id, action, user_id, date range. Admin only.
   - `GET /api/v1/hypotheses/{id}/history` — audit entries for specific hypothesis (all users can access).

7. **AuditLogResource**: id, entity_type, entity_id, action, changes, user (name), timestamp.

#### TDD

**RED phase:**
```php
public function test_hypothesis_creation_logged(): void
{
    $user = User::factory()->create();
    $this->actingAs($user)->postJson('/api/v1/hypotheses', ['title' => 'Test']);

    $this->assertDatabaseHas('audit_log', [
        'entity_type' => 'hypothesis',
        'action' => 'create',
        'user_id' => $user->id,
    ]);
}

public function test_status_change_logged(): void
{
    // Setup transition and trigger it
    // Assert audit_log has status_change entry
}

public function test_audit_log_filterable_by_entity(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    AuditLog::factory()->count(3)->create(['entity_type' => 'hypothesis']);
    AuditLog::factory()->count(2)->create(['entity_type' => 'experiment']);

    $response = $this->actingAs($admin)->getJson('/api/v1/audit-log?entity_type=hypothesis');
    $response->assertOk()->assertJsonCount(3, 'data');
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=AuditLogTest
```

#### Acceptance Criteria
- [ ] Hypothesis CRUD operations auto-logged
- [ ] Status transitions auto-logged with from/to
- [ ] Experiment changes auto-logged
- [ ] Audit log endpoint paginated and filterable
- [ ] Per-hypothesis history endpoint works
- [ ] All 3+ tests pass

---

### Task T16: SLA Engine

**Files:**
- `backend/app/Services/SlaChecker.php`
- `backend/app/Console/Commands/CheckSlaViolations.php`
- `backend/app/Events/SlaWarning.php`
- `backend/app/Events/SlaViolation.php`
- `backend/routes/console.php` (modify — register schedule)
- `backend/tests/Unit/Services/SlaCheckerTest.php`

**Depends on:** T03, T09
**Complexity:** M
**Risk:** MEDIUM
**Input:** hypotheses with sla_deadline, sla_configs
**Output:** Scheduled command that checks SLA, updates sla_status, fires events
**Rollback:** Delete new files, revert console routes

#### What to do

1. **SlaChecker** service:
```php
class SlaChecker
{
    public function check(): array
    {
        $warnings = [];
        $violations = [];

        $hypotheses = Hypothesis::query()
            ->whereNotNull('sla_deadline')
            ->whereNotIn('status', [HypothesisStatus::Done->value, HypothesisStatus::Archived->value])
            ->get();

        foreach ($hypotheses as $hypothesis) {
            $deadline = Carbon::parse($hypothesis->sla_deadline);
            $slaConfig = SlaConfig::where('status', $hypothesis->status->value)->first();
            
            if (! $slaConfig) continue;

            $warningDate = $deadline->copy()->subDays($slaConfig->warning_days);

            if (now()->gte($deadline) && $hypothesis->sla_status !== 'violated') {
                $hypothesis->update(['sla_status' => 'violated']);
                $violations[] = $hypothesis;
                event(new SlaViolation($hypothesis));
            } elseif (now()->gte($warningDate) && now()->lt($deadline) && $hypothesis->sla_status !== 'warning') {
                $hypothesis->update(['sla_status' => 'warning']);
                $warnings[] = $hypothesis;
                event(new SlaWarning($hypothesis));
            }
        }

        return ['warnings' => count($warnings), 'violations' => count($violations)];
    }
}
```

2. **CheckSlaViolations** Artisan command:
```php
// Signature: sla:check
// Calls SlaChecker::check() and outputs results
```

3. Schedule in `routes/console.php`:
```php
Schedule::command('sla:check')->hourly();
```

#### TDD

**RED phase:**
```php
public function test_detects_sla_violation(): void
{
    SlaConfig::factory()->create(['status' => 'scoring', 'limit_days' => 7, 'warning_days' => 2]);
    $hypothesis = Hypothesis::factory()->create([
        'status' => HypothesisStatus::Scoring,
        'sla_deadline' => now()->subDay(),
        'sla_status' => 'ok',
    ]);

    $result = (new SlaChecker())->check();

    $this->assertEquals(1, $result['violations']);
    $this->assertEquals('violated', $hypothesis->fresh()->sla_status);
}

public function test_detects_sla_warning(): void
{
    SlaConfig::factory()->create(['status' => 'scoring', 'limit_days' => 7, 'warning_days' => 2]);
    $hypothesis = Hypothesis::factory()->create([
        'status' => HypothesisStatus::Scoring,
        'sla_deadline' => now()->addDay(),
        'sla_status' => 'ok',
    ]);

    $result = (new SlaChecker())->check();

    $this->assertEquals(1, $result['warnings']);
    $this->assertEquals('warning', $hypothesis->fresh()->sla_status);
}

public function test_ignores_done_hypotheses(): void
{
    $hypothesis = Hypothesis::factory()->create([
        'status' => HypothesisStatus::Done,
        'sla_deadline' => now()->subWeek(),
        'sla_status' => 'ok',
    ]);

    $result = (new SlaChecker())->check();

    $this->assertEquals(0, $result['violations']);
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=SlaCheckerTest && \
docker compose exec backend php artisan sla:check
```

#### Acceptance Criteria
- [ ] Violations detected when deadline passed
- [ ] Warnings detected when within warning window
- [ ] Done/Archived hypotheses ignored
- [ ] SLA status updated on hypothesis
- [ ] Events dispatched for warnings and violations
- [ ] Artisan command runs successfully
- [ ] All 3+ tests pass

---

### Task T17: Notifications System (Database + Telegram)

**Files:**
- `backend/app/Services/NotificationDispatcher.php`
- `backend/app/Services/TelegramNotifier.php`
- `backend/app/Jobs/SendTelegramNotification.php`
- `backend/app/Listeners/NotifyOnStatusChange.php`
- `backend/app/Listeners/NotifyOnSlaViolation.php`
- `backend/app/Listeners/NotifyOnCommitteeDecision.php`
- `backend/app/Http/Controllers/Api/V1/NotificationController.php`
- `backend/app/Http/Resources/NotificationResource.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/NotificationTest.php`

**Depends on:** T09, T16, T14
**Complexity:** M
**Risk:** MEDIUM
**Input:** Events from status machine, SLA, committee; notification_events config; notifications table
**Output:** In-app notifications + queued Telegram messages
**Rollback:** Delete new files, revert routes and event bindings

#### What to do

1. **NotificationDispatcher** — central service that:
   - Checks `notification_events` table to see if event type is active
   - Determines recipients based on config (roles or specific users)
   - Creates `Notification` records for in-app
   - Dispatches `SendTelegramNotification` job if Telegram channel is enabled

2. **Event Listeners** — bind to existing events:
   - `HypothesisStatusChanged` → `NotifyOnStatusChange`
   - `SlaViolation` / `SlaWarning` → `NotifyOnSlaViolation`
   - Committee decision finalized → `NotifyOnCommitteeDecision`
   Each listener calls `NotificationDispatcher`.

3. **TelegramNotifier**:
```php
class TelegramNotifier
{
    public function send(string $chatId, string $message): void
    {
        $botToken = config('services.telegram.bot_token');
        if (! $botToken || ! $chatId) {
            Log::warning('Telegram notification skipped: missing config');
            return;
        }

        Http::post("https://api.telegram.org/bot{$botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'HTML',
        ]);
    }
}
```

4. **SendTelegramNotification** job — queued on Redis, calls TelegramNotifier. On failure: log and discard (graceful degradation, no retry explosion).

5. **NotificationController**:
   - `GET /api/v1/notifications` — list for authenticated user, paginated, filter by is_read
   - `PATCH /api/v1/notifications/{id}/read` — mark as read
   - `POST /api/v1/notifications/mark-all-read` — mark all as read
   - `GET /api/v1/notifications/unread-count` — returns `{ count: N }`

6. Add Telegram config to `backend/config/services.php`:
```php
'telegram' => [
    'bot_token' => env('TELEGRAM_BOT_TOKEN'),
    'chat_id' => env('TELEGRAM_CHAT_ID'),
],
```

#### TDD

**RED phase:**
```php
public function test_notification_created_on_status_change(): void
{
    NotificationEvent::factory()->create(['event_type' => 'status_change', 'is_active' => true]);
    $user = User::factory()->create(['role' => UserRole::Admin]);
    $hypothesis = Hypothesis::factory()->create(['owner_id' => $user->id]);
    
    event(new HypothesisStatusChanged($hypothesis, HypothesisStatus::Backlog, HypothesisStatus::Scoring, $user));

    $this->assertDatabaseHas('notifications', [
        'type' => 'status_change',
        'hypothesis_id' => $hypothesis->id,
    ]);
}

public function test_user_can_list_own_notifications(): void
{
    $user = User::factory()->create();
    Notification::factory()->count(3)->create(['user_id' => $user->id]);
    Notification::factory()->count(2)->create(); // other user

    $response = $this->actingAs($user)->getJson('/api/v1/notifications');
    $response->assertOk()->assertJsonCount(3, 'data');
}

public function test_user_can_mark_notification_read(): void
{
    $user = User::factory()->create();
    $notification = Notification::factory()->create(['user_id' => $user->id, 'is_read' => false]);

    $response = $this->actingAs($user)->patchJson("/api/v1/notifications/{$notification->id}/read");
    $response->assertOk();
    $this->assertTrue($notification->fresh()->is_read);
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=NotificationTest
```

#### Acceptance Criteria
- [ ] In-app notifications created on status change events
- [ ] Notifications filtered per user
- [ ] Mark read / mark all read works
- [ ] Unread count endpoint works
- [ ] Telegram job dispatched (testable via Queue::fake)
- [ ] Graceful degradation when Telegram config missing
- [ ] All 4+ tests pass

---

### Task T18: Admin Configuration APIs (Statuses, Transitions, Scoring, SLA, Notifications, Deep Dive)

**Files:**
- `backend/app/Http/Controllers/Api/V1/Admin/StatusTransitionController.php`
- `backend/app/Http/Controllers/Api/V1/Admin/ScoringConfigController.php`
- `backend/app/Http/Controllers/Api/V1/Admin/SlaConfigController.php`
- `backend/app/Http/Controllers/Api/V1/Admin/NotificationConfigController.php`
- `backend/app/Http/Controllers/Api/V1/Admin/DeepDiveConfigController.php`
- `backend/app/Http/Controllers/Api/V1/Admin/ScoringThresholdController.php`
- Corresponding Request classes (6+)
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/Admin/ConfigurationTest.php`

**Depends on:** T07, T04
**Complexity:** M
**Risk:** LOW
**Input:** All config tables seeded, admin middleware
**Output:** Full CRUD for all admin-configurable entities
**Rollback:** Delete new files, revert routes

#### What to do

1. **StatusTransitionController**: CRUD for status_transitions (from_status, to_status, allowed_roles, condition_type, condition_value, is_active).

2. **ScoringConfigController**: CRUD for scoring_criteria (name, description, input_type, min/max, weight, thresholds, is_stop_factor, stage, order, is_active).

3. **ScoringThresholdController**: GET/PUT for scoring_threshold_configs (single record — primary_threshold, deep_threshold).

4. **SlaConfigController**: CRUD for sla_configs (status, limit_days, warning_days, is_active).

5. **NotificationConfigController**: CRUD for notification_events (event_type, is_active, recipients, template, channel).

6. **DeepDiveConfigController**: CRUD for deep_dive_stages (name, description, order, is_required, responsible_role, is_active). Support reordering.

7. All endpoints under `/api/v1/admin/` with admin middleware.

#### TDD

**RED phase:**
```php
public function test_admin_can_update_scoring_threshold(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    ScoringThresholdConfig::create(['primary_threshold' => 7.0, 'deep_threshold' => 7.0]);

    $response = $this->actingAs($admin)->putJson('/api/v1/admin/scoring-thresholds', [
        'primary_threshold' => 6.5,
        'deep_threshold' => 8.0,
    ]);

    $response->assertOk();
    $this->assertEquals(6.5, ScoringThresholdConfig::first()->primary_threshold);
}

public function test_admin_can_create_status_transition(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/status-transitions', [
        'from_status' => 'experiment',
        'to_status' => 'deep_dive',
        'allowed_roles' => ['pd_manager', 'admin'],
        'condition_type' => 'none',
    ]);

    $response->assertCreated();
}

public function test_admin_can_reorder_deep_dive_stages(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $stage1 = DeepDiveStage::factory()->create(['order' => 1]);
    $stage2 = DeepDiveStage::factory()->create(['order' => 2]);

    $response = $this->actingAs($admin)->putJson('/api/v1/admin/deep-dive-stages/reorder', [
        'order' => [$stage2->id, $stage1->id],
    ]);

    $response->assertOk();
    $this->assertEquals(1, $stage2->fresh()->order);
    $this->assertEquals(2, $stage1->fresh()->order);
}
```

**GREEN phase:** Implement all controllers with standard Laravel resource CRUD patterns.

#### Verify
```bash
docker compose exec backend php artisan test --filter=ConfigurationTest
```

#### Acceptance Criteria
- [ ] All config CRUD endpoints work
- [ ] Non-admin gets 403
- [ ] Scoring thresholds updateable
- [ ] Deep dive stages reorderable
- [ ] Validation prevents invalid data
- [ ] All 4+ tests pass

---

### Task T19: File Upload API + Passport Export (PDF/Excel)

**Files:**
- `backend/app/Http/Controllers/Api/V1/FileController.php`
- `backend/app/Http/Controllers/Api/V1/ExportController.php`
- `backend/app/Services/PassportGenerator.php`
- `backend/app/Exports/HypothesisExport.php`
- `backend/app/Http/Resources/FileResource.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/FileUploadTest.php`
- `backend/tests/Feature/ExportTest.php`

**Depends on:** T08
**Complexity:** M
**Risk:** MEDIUM
**Input:** hypothesis_files table, DomPDF + PhpSpreadsheet packages
**Output:** File upload/download + PDF passport generation + Excel export
**Rollback:** Delete new files, revert routes

#### What to do

1. **FileController**:
   - `POST /api/v1/hypotheses/{id}/files` — upload file (multipart, max 20MB). Store in `storage/app/hypothesis-files/{hypothesis_id}/`. Save record in hypothesis_files.
   - `GET /api/v1/hypotheses/{id}/files` — list files for hypothesis, filterable by stage
   - `GET /api/v1/files/{id}/download` — stream download
   - `DELETE /api/v1/files/{id}` — delete file from storage + DB

2. **PassportGenerator** service:
   - Collects all hypothesis data: description, scoring results, deep dive progress, experiment results, risks, recommendations
   - Renders Blade template `backend/resources/views/exports/passport.blade.php`
   - Returns PDF via DomPDF

3. **HypothesisExport** (Maatwebsite\Excel):
   - Exports hypothesis data as Excel sheet with sections: general info, scoring, deep dive progress, experiments, respondents

4. **ExportController**:
   - `GET /api/v1/hypotheses/{id}/export/pdf` — download passport PDF
   - `GET /api/v1/hypotheses/{id}/export/excel` — download hypothesis data as Excel

5. Configure file upload limits in `backend/config/filesystems.php` — add `hypothesis-files` disk (local).

#### TDD

**RED phase:**
```php
public function test_can_upload_file(): void
{
    Storage::fake('local');
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();

    $response = $this->actingAs($user)->postJson("/api/v1/hypotheses/{$hypothesis->id}/files", [
        'file' => UploadedFile::fake()->create('research.pdf', 1024),
        'stage' => 'deep_dive',
    ]);

    $response->assertCreated();
    $this->assertDatabaseHas('hypothesis_files', ['hypothesis_id' => $hypothesis->id, 'name' => 'research.pdf']);
}

public function test_can_export_pdf(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();

    $response = $this->actingAs($user)->get("/api/v1/hypotheses/{$hypothesis->id}/export/pdf");
    $response->assertOk()->assertHeader('content-type', 'application/pdf');
}

public function test_can_export_excel(): void
{
    $user = User::factory()->create();
    $hypothesis = Hypothesis::factory()->create();

    $response = $this->actingAs($user)->get("/api/v1/hypotheses/{$hypothesis->id}/export/excel");
    $response->assertOk();
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter="FileUploadTest|ExportTest"
```

#### Acceptance Criteria
- [ ] Files upload and store correctly
- [ ] File list and download work
- [ ] PDF passport generates with hypothesis data
- [ ] Excel export contains hypothesis data
- [ ] File deletion removes from storage and DB
- [ ] All 3+ tests pass

---

### Task T20: Analytics API

**Files:**
- `backend/app/Http/Controllers/Api/V1/AnalyticsController.php`
- `backend/app/Services/AnalyticsService.php`
- `backend/routes/api.php` (modify)
- `backend/tests/Feature/AnalyticsTest.php`

**Depends on:** T08
**Complexity:** S
**Risk:** LOW
**Input:** Hypotheses data
**Output:** Basic analytics endpoints
**Rollback:** Delete new files, revert routes

#### What to do

1. **AnalyticsService**:
   - `getStatusDistribution()` — count hypotheses per status
   - `getInitiatorStats()` — count hypotheses per initiator
   - `getTeamStats()` — count hypotheses per team
   - `getTimelineStats(?Carbon $from, ?Carbon $to)` — hypotheses created per month in date range
   - `getAverageScoringByStatus()` — average primary scoring per status

2. **AnalyticsController**:
   - `GET /api/v1/analytics/status-distribution` → `{data: [{status, count}]}`
   - `GET /api/v1/analytics/initiator-stats` → `{data: [{user_id, name, count}]}`
   - `GET /api/v1/analytics/team-stats` → `{data: [{team_id, name, count}]}`
   - `GET /api/v1/analytics/timeline?from=&to=` → `{data: [{month, count}]}`
   - `GET /api/v1/analytics/export` → Excel download of all analytics

#### TDD

**RED phase:**
```php
public function test_status_distribution(): void
{
    $user = User::factory()->create();
    Hypothesis::factory()->count(3)->create(['status' => HypothesisStatus::Backlog]);
    Hypothesis::factory()->count(2)->create(['status' => HypothesisStatus::Scoring]);

    $response = $this->actingAs($user)->getJson('/api/v1/analytics/status-distribution');
    $response->assertOk();
    
    $data = collect($response->json('data'));
    $this->assertEquals(3, $data->firstWhere('status', 'backlog')['count']);
    $this->assertEquals(2, $data->firstWhere('status', 'scoring')['count']);
}
```

**GREEN phase:** Implement as described.

#### Verify
```bash
docker compose exec backend php artisan test --filter=AnalyticsTest
```

#### Acceptance Criteria
- [ ] Status distribution returns correct counts
- [ ] Initiator and team stats work
- [ ] Timeline stats filterable by date range
- [ ] Analytics Excel export works
- [ ] All 2+ tests pass

---

### Task T21: Frontend — API Client + Effector Auth Store

**Files:**
- `lib/api-client.ts` (new)
- `lib/stores/auth/model.ts` (new)
- `lib/stores/auth/types.ts` (new)
- `lib/auth-context.tsx` (modify — connect to Effector store)
- `package.json` (add effector, effector-react, axios)
- `app/(auth)/login/page.tsx` (modify — use real API)

**Depends on:** T06 (backend auth API must exist)
**Complexity:** M
**Risk:** MEDIUM
**Input:** Working Sanctum auth API, existing mock auth-context
**Output:** Real login/logout via API, Effector-based auth state
**Rollback:** Revert changes to auth-context.tsx, login page; delete new files; remove packages

#### What to do

1. Install packages:
```bash
npm install effector effector-react axios
```

2. Create `lib/api-client.ts`:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true, // Sanctum cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// CSRF cookie interceptor
apiClient.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/sanctum/csrf-cookie`,
      { withCredentials: true }
    );
  }
  return config;
});

// 401 interceptor — redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

3. Create `lib/stores/auth/model.ts`:
```typescript
import { createStore, createEffect, createEvent, sample } from 'effector';
import { apiClient } from '@/lib/api-client';

// Types matching backend UserResource
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  team_id: number | null;
  team: { id: number; name: string } | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

// Effects
export const loginFx = createEffect(async (params: { email: string; password: string }) => {
  const { data } = await apiClient.post('/api/v1/auth/login', params);
  return data.user as AuthUser;
});

export const logoutFx = createEffect(async () => {
  await apiClient.post('/api/v1/auth/logout');
});

export const fetchMeFx = createEffect(async () => {
  const { data } = await apiClient.get('/api/v1/auth/me');
  return data.user as AuthUser;
});

// Events
export const resetAuth = createEvent();

// Stores
export const $user = createStore<AuthUser | null>(null)
  .on(loginFx.doneData, (_, user) => user)
  .on(fetchMeFx.doneData, (_, user) => user)
  .on(logoutFx.done, () => null)
  .reset(resetAuth);

export const $isAuthenticated = $user.map((user) => user !== null);
export const $isAuthLoading = loginFx.pending;
```

4. Modify `lib/auth-context.tsx` to use Effector store under the hood. Keep the same `useAuth()` interface for backward compatibility but internally call Effector effects:
```typescript
// Replace mock login with loginFx call
// Replace user state with useUnit($user)
// Keep hasPermission logic but map new 7-role system
```

5. Update `app/(auth)/login/page.tsx` to call the real API via the updated auth context. Keep mock fallback mode: if `NEXT_PUBLIC_API_URL` is not set, use existing mock behavior.

6. Add `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`.

#### TDD

**RED phase:**
`__tests__/stores/auth.test.ts` (Vitest):
```typescript
import { fork, allSettled } from 'effector';
import { $user, loginFx, logoutFx, resetAuth } from '@/lib/stores/auth/model';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Auth store', () => {
  test('loginFx sets user on success', async () => {
    const mockUser = { id: 1, email: 'test@test.com', name: 'Test', role: 'admin' };
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { user: mockUser } });

    const scope = fork();
    await allSettled(loginFx, { scope, params: { email: 'test@test.com', password: 'pass' } });

    expect(scope.getState($user)).toEqual(mockUser);
  });

  test('logoutFx clears user', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient.post).mockResolvedValueOnce({});

    const scope = fork({ values: [[$user, { id: 1, name: 'Test' }]] });
    await allSettled(logoutFx, { scope });

    expect(scope.getState($user)).toBeNull();
  });
});
```

**GREEN phase:** Implement as described. Need to also add Vitest config if not present.

#### Verify
```bash
npx vitest run --filter="auth"
```

#### Acceptance Criteria
- [ ] Login calls real API and sets user in Effector store
- [ ] Logout clears user state
- [ ] CSRF cookie fetched before POST requests
- [ ] 401 responses redirect to /login
- [ ] Existing `useAuth()` interface preserved for backward compatibility
- [ ] Mock fallback works when API_URL not set
- [ ] All 2+ Vitest tests pass

---

### Task T22: Frontend — Effector Hypothesis Stores + Page Integration

**Files:**
- `lib/stores/hypotheses/model.ts` (new)
- `lib/stores/hypotheses/types.ts` (new)
- `app/(dashboard)/hypotheses/page.tsx` (modify)
- `app/(dashboard)/hypotheses/[id]/page.tsx` (modify)
- `app/(dashboard)/hypotheses/new/page.tsx` (modify)
- `app/(dashboard)/dashboard/page.tsx` (modify)
- `lib/types.ts` (modify — align with backend API)

**Depends on:** T21, T08, T09
**Complexity:** L
**Risk:** HIGH
**Input:** Backend hypothesis API, existing mock-based pages
**Output:** Hypothesis list, detail, create pages using real API
**Rollback:** Revert all modified page files, delete store files

#### What to do

1. Create `lib/stores/hypotheses/model.ts`:
```typescript
import { createStore, createEffect, createEvent, sample } from 'effector';
import { apiClient } from '@/lib/api-client';

// List
export const fetchHypothesesFx = createEffect(async (params?: {
  status?: string;
  search?: string;
  team_id?: number;
  page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}) => {
  const { data } = await apiClient.get('/api/v1/hypotheses', { params });
  return data; // { data: Hypothesis[], meta: { current_page, last_page, total } }
});

// Detail
export const fetchHypothesisFx = createEffect(async (id: number) => {
  const { data } = await apiClient.get(`/api/v1/hypotheses/${id}`);
  return data.data;
});

// Create
export const createHypothesisFx = createEffect(async (params: {
  title: string;
  description?: string;
  problem?: string;
  solution?: string;
  target_audience?: string;
  team_id?: number;
  priority?: string;
}) => {
  const { data } = await apiClient.post('/api/v1/hypotheses', params);
  return data.data;
});

// Update
export const updateHypothesisFx = createEffect(async ({ id, ...params }: { id: number } & Record<string, unknown>) => {
  const { data } = await apiClient.put(`/api/v1/hypotheses/${id}`, params);
  return data.data;
});

// Transition
export const transitionHypothesisFx = createEffect(async ({ id, to_status, comment }: {
  id: number;
  to_status: string;
  comment?: string;
}) => {
  const { data } = await apiClient.post(`/api/v1/hypotheses/${id}/transition`, { to_status, comment });
  return data.data;
});

// Stores
export const $hypotheses = createStore<any[]>([])
  .on(fetchHypothesesFx.doneData, (_, result) => result.data);

export const $hypothesesMeta = createStore<any>(null)
  .on(fetchHypothesesFx.doneData, (_, result) => result.meta);

export const $currentHypothesis = createStore<any>(null)
  .on(fetchHypothesisFx.doneData, (_, data) => data)
  .on(updateHypothesisFx.doneData, (_, data) => data)
  .on(transitionHypothesisFx.doneData, (_, data) => data);

export const $isLoading = fetchHypothesesFx.pending;
```

2. Update `lib/types.ts`:
   - Expand `UserRole` to 7 roles: `'admin' | 'initiator' | 'pd_manager' | 'analyst' | 'tech_lead' | 'bizdev' | 'committee'`
   - Add `initiator_id` to Hypothesis type
   - Add `priority` field
   - Keep backward compatibility with existing component props

3. Modify **hypothesis list page** (`app/(dashboard)/hypotheses/page.tsx`):
   - Replace `mockHypotheses` import with `useUnit` from Effector
   - Call `fetchHypothesesFx` on mount (via `useEffect` or Effector gate)
   - Wire up filters to re-fetch with params
   - Keep same UI components

4. Modify **hypothesis detail page** (`app/(dashboard)/hypotheses/[id]/page.tsx`):
   - Replace mock data lookup with `fetchHypothesisFx`
   - Wire status transition panel to `transitionHypothesisFx`

5. Modify **create hypothesis page** (`app/(dashboard)/hypotheses/new/page.tsx`):
   - Replace mock create with `createHypothesisFx`
   - Redirect to detail page on success

6. Modify **dashboard page** — use real data for hypothesis counts by status.

7. Add mock fallback: if API call fails and `NEXT_PUBLIC_USE_MOCKS=true`, fall back to mock data.

#### TDD

**RED phase:**
```typescript
// __tests__/stores/hypotheses.test.ts
import { fork, allSettled } from 'effector';
import { $hypotheses, fetchHypothesesFx, createHypothesisFx } from '@/lib/stores/hypotheses/model';

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

test('fetchHypothesesFx populates store', async () => {
  const { apiClient } = await import('@/lib/api-client');
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: { data: [{ id: 1, title: 'Test' }], meta: { total: 1 } },
  });

  const scope = fork();
  await allSettled(fetchHypothesesFx, { scope });

  expect(scope.getState($hypotheses)).toHaveLength(1);
});
```

**GREEN phase:** Implement stores and page modifications as described.

#### Verify
```bash
npx vitest run --filter="hypotheses" && npm run build
```

#### Acceptance Criteria
- [ ] Hypothesis list loads from API with pagination
- [ ] Filters trigger API re-fetch
- [ ] Detail page loads full hypothesis data
- [ ] Create page submits to API
- [ ] Status transitions work from detail page
- [ ] Mock fallback works when API unavailable
- [ ] Build succeeds without TypeScript errors
- [ ] Vitest tests pass

**Fallback approach:** If full Effector integration proves too complex for all pages at once, integrate only the hypothesis list page first and keep detail/create on mocks. Add remaining pages as follow-up tasks.

---

### Task T23: Frontend — Effector Admin Stores + Admin Pages Integration

**Files:**
- `lib/stores/admin/users.ts` (new)
- `lib/stores/admin/teams.ts` (new)
- `lib/stores/admin/config.ts` (new — covers transitions, scoring, SLA, notifications, deep-dive, committee)
- `app/(dashboard)/admin/users/page.tsx` (modify)
- `app/(dashboard)/admin/teams/page.tsx` (modify)
- `app/(dashboard)/admin/statuses/page.tsx` (modify)
- `app/(dashboard)/admin/transitions/page.tsx` (modify)
- `app/(dashboard)/admin/scoring/page.tsx` (modify)
- `app/(dashboard)/admin/scoring-thresholds/page.tsx` (modify)
- `app/(dashboard)/admin/sla/page.tsx` (modify)
- `app/(dashboard)/admin/notifications/page.tsx` (modify)
- `app/(dashboard)/admin/committee/page.tsx` (modify)
- `app/(dashboard)/admin/deep-dive/page.tsx` (modify)
- `app/(dashboard)/admin/audit/page.tsx` (modify)

**Depends on:** T21, T07, T18
**Complexity:** L
**Risk:** MEDIUM
**Input:** Backend admin APIs, existing mock-based admin pages
**Output:** All admin pages using real API
**Rollback:** Revert all modified page files, delete store files

#### What to do

1. Create admin Effector stores — one store module per domain:

`lib/stores/admin/users.ts`:
```typescript
export const fetchUsersFx = createEffect(async (params) => {
  const { data } = await apiClient.get('/api/v1/admin/users', { params });
  return data;
});
export const createUserFx = createEffect(/* ... */);
export const updateUserFx = createEffect(/* ... */);
export const toggleUserActiveFx = createEffect(/* ... */);
export const $users = createStore([]).on(fetchUsersFx.doneData, (_, d) => d.data);
```

Similar pattern for teams, config stores.

`lib/stores/admin/config.ts`:
```typescript
// Status transitions
export const fetchTransitionsFx = createEffect(/* GET /api/v1/admin/status-transitions */);
export const createTransitionFx = createEffect(/* POST */);
export const updateTransitionFx = createEffect(/* PUT */);
export const deleteTransitionFx = createEffect(/* DELETE */);

// Scoring criteria
export const fetchScoringCriteriaFx = createEffect(/* GET /api/v1/admin/scoring-criteria */);
// ... CRUD effects

// SLA configs
export const fetchSlaConfigsFx = createEffect(/* GET /api/v1/admin/sla-configs */);
// ... CRUD effects

// Notification events
export const fetchNotificationEventsFx = createEffect(/* GET /api/v1/admin/notification-events */);
// ... CRUD effects

// Deep dive stages
export const fetchDeepDiveStagesFx = createEffect(/* GET /api/v1/admin/deep-dive-stages */);
// ... CRUD effects

// Committee members
export const fetchCommitteeMembersFx = createEffect(/* GET /api/v1/admin/committee-members */);
// ... CRUD effects

// Scoring thresholds
export const fetchScoringThresholdsFx = createEffect(/* GET /api/v1/admin/scoring-thresholds */);
export const updateScoringThresholdsFx = createEffect(/* PUT */);
```

2. Modify each admin page:
   - Replace mock data imports with `useUnit()` from corresponding store
   - Call fetch effects on mount
   - Wire CRUD operations to effects
   - Keep existing UI/layout — only change data source

3. For audit log page — use `fetchAuditLogFx` with pagination and filters.

4. Add mock fallback per Task T22 pattern.

#### TDD

**RED phase:**
```typescript
// __tests__/stores/admin-config.test.ts
test('fetchTransitionsFx populates transitions store', async () => {
  // Similar pattern to T22 tests
});
```

**GREEN phase:** Implement all stores and page modifications.

#### Verify
```bash
npx vitest run --filter="admin" && npm run build
```

#### Acceptance Criteria
- [ ] Users page loads/creates/updates from API
- [ ] Teams page loads/creates/updates from API
- [ ] All config pages (transitions, scoring, SLA, notifications, deep-dive, committee) use API
- [ ] Audit log page loads with pagination and filters
- [ ] Admin-only access enforced (403 for non-admin)
- [ ] Build succeeds
- [ ] Vitest tests pass

---

### Task T24: Frontend — Remaining Stores (Scoring, Deep Dive, Experiments, Committee, Notifications, Analytics)

**Files:**
- `lib/stores/scoring/model.ts` (new)
- `lib/stores/deep-dive/model.ts` (new)
- `lib/stores/experiments/model.ts` (new)
- `lib/stores/committee/model.ts` (new)
- `lib/stores/notifications/model.ts` (new)
- `lib/stores/analytics/model.ts` (new)
- `components/hypotheses/scoring-form.tsx` (modify)
- `components/hypotheses/deep-dive-form.tsx` (modify)
- `components/hypotheses/experiments-list.tsx` (modify)
- `components/hypotheses/experiment-card.tsx` (modify)
- `components/hypotheses/committee-decision-form.tsx` (modify)
- `components/hypotheses/respondent-crm.tsx` (modify)
- `components/layout/notification-dropdown.tsx` (modify)
- `app/(dashboard)/notifications/page.tsx` (modify)
- `app/(dashboard)/analytics/page.tsx` (modify)

**Depends on:** T22, T23, T10, T11, T12, T13, T14, T17, T20
**Complexity:** L
**Risk:** MEDIUM
**Input:** All backend APIs, existing mock-based components
**Output:** All remaining frontend components connected to real API
**Rollback:** Revert all modified files, delete store files

#### What to do

1. Create Effector stores for each domain, following the same pattern as T21-T23:

**Scoring store** (`lib/stores/scoring/model.ts`):
   - `fetchScoringFx(hypothesisId, stage)` — get current scoring
   - `submitScoringFx({hypothesisId, stage, criteria_scores})` — submit scores
   - `fetchCriteriaFx(stage)` — list criteria
   - `$currentScoring`, `$criteria` stores

**Deep Dive store** (`lib/stores/deep-dive/model.ts`):
   - `fetchDeepDiveFx(hypothesisId)` — get stages + progress
   - `toggleStageFx({hypothesisId, stageId, is_completed})` — toggle completion
   - `addCommentFx({hypothesisId, stageId, text})` — add comment
   - `$deepDiveStages`, `$deepDiveProgress` stores

**Experiments store** (`lib/stores/experiments/model.ts`):
   - `fetchExperimentsFx(hypothesisId)` — list experiments
   - `createExperimentFx`, `updateExperimentFx`, `deleteExperimentFx`
   - `setExperimentResultFx`
   - `$experiments` store

**Committee store** (`lib/stores/committee/model.ts`):
   - `fetchVotesFx(hypothesisId)` — get votes
   - `castVoteFx({hypothesisId, vote, comment})`
   - `finalizeDecisionFx(hypothesisId)`
   - `$votes` store

**Notifications store** (`lib/stores/notifications/model.ts`):
   - `fetchNotificationsFx(params)` — paginated
   - `markReadFx(id)`, `markAllReadFx()`
   - `fetchUnreadCountFx()`
   - `$notifications`, `$unreadCount` stores

**Analytics store** (`lib/stores/analytics/model.ts`):
   - `fetchStatusDistributionFx()`
   - `fetchInitiatorStatsFx()`
   - `fetchTeamStatsFx()`
   - `fetchTimelineStatsFx(params)`

2. Modify components to use stores:
   - `scoring-form.tsx` — fetch criteria on mount, submit to API
   - `deep-dive-form.tsx` — load stages, toggle completion
   - `experiments-list.tsx` + `experiment-card.tsx` — CRUD via store
   - `committee-decision-form.tsx` — load votes, cast vote
   - `respondent-crm.tsx` — CRUD respondents, show pain summary
   - `notification-dropdown.tsx` — use unread count store, mark read
   - `notifications/page.tsx` — full notification list
   - `analytics/page.tsx` — charts from analytics store

3. Maintain mock fallback pattern.

#### TDD

**RED phase:**
```typescript
// __tests__/stores/scoring.test.ts
test('submitScoringFx updates current scoring', async () => {
  // Mock API, test store update
});

// __tests__/stores/notifications.test.ts
test('markReadFx updates notification in store', async () => {
  // Mock API, test store update
});
```

**GREEN phase:** Implement all stores and component modifications.

#### Verify
```bash
npx vitest run && npm run build
```

#### Acceptance Criteria
- [ ] Scoring form submits to API, displays results
- [ ] Deep dive checklist toggles via API
- [ ] Experiments CRUD works end-to-end
- [ ] Committee voting works for committee-role users
- [ ] Notifications load, mark read, show unread count
- [ ] Analytics page shows real data
- [ ] Respondent CRM works
- [ ] Build succeeds
- [ ] All Vitest tests pass

---

### Task T25: PHPUnit Feature Tests — Comprehensive Backend Coverage

**Files:**
- `backend/tests/Feature/Hypothesis/FullWorkflowTest.php`
- `backend/tests/Feature/Hypothesis/PermissionsTest.php`
- `backend/tests/Feature/Admin/FullAdminTest.php`
- `backend/tests/Feature/IntegrationTest.php`

**Depends on:** T06-T20 (all backend tasks)
**Complexity:** M
**Risk:** LOW
**Input:** All backend endpoints implemented
**Output:** Comprehensive feature test coverage for critical flows
**Rollback:** Delete test files

#### What to do

1. **FullWorkflowTest** — end-to-end hypothesis lifecycle:
```php
public function test_full_hypothesis_lifecycle(): void
{
    // 1. Initiator creates hypothesis
    // 2. PD Manager transitions to scoring
    // 3. Analyst submits primary scoring (above threshold)
    // 4. PD Manager transitions to deep_dive
    // 5. Complete all required deep dive stages
    // 6. PD Manager transitions to experiment
    // 7. Create experiment with metrics, set result
    // 8. PD Manager transitions to go_no_go
    // 9. Committee members vote (majority go)
    // 10. Admin finalizes decision
    // 11. Verify hypothesis is 'done'
    // 12. Verify audit log has all entries
    // 13. Verify notifications created
}
```

2. **PermissionsTest** — verify role restrictions:
```php
public function test_initiator_cannot_access_admin(): void { /* ... */ }
public function test_committee_can_only_view_hypotheses(): void { /* ... */ }
public function test_analyst_can_only_edit_scoring(): void { /* ... */ }
// etc for all 7 roles
```

3. **FullAdminTest** — all admin config operations in sequence.

4. **IntegrationTest** — SLA violation + notification flow.

#### TDD
These ARE the tests. Write them first, then verify all pass against existing implementation.

#### Verify
```bash
docker compose exec backend php artisan test
```

#### Acceptance Criteria
- [ ] Full lifecycle test passes (hypothesis from backlog to done)
- [ ] All role permissions correctly enforced
- [ ] Admin configuration round-trip works
- [ ] SLA + notification integration works
- [ ] Total backend test count > 50
- [ ] All tests pass

---

### Task T26: Playwright E2E Tests — Critical User Paths

**Files:**
- `e2e/setup.ts` (new — Playwright config, test fixtures)
- `e2e/auth.spec.ts` (new)
- `e2e/hypothesis-lifecycle.spec.ts` (new)
- `e2e/admin.spec.ts` (new)
- `playwright.config.ts` (new)
- `package.json` (add @playwright/test)

**Depends on:** T22, T24 (frontend integration complete)
**Complexity:** M
**Risk:** MEDIUM
**Input:** Full working app (frontend + backend via Docker Compose)
**Output:** Automated E2E tests for critical paths
**Rollback:** Delete e2e directory, playwright.config.ts, remove devDependency

#### What to do

1. Install Playwright:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

2. Create `playwright.config.ts`:
```typescript
export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:3000',
  use: {
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'docker compose up -d',
      url: 'http://localhost:8000/api/v1/health',
      reuseExistingServer: true,
    },
  ],
});
```

3. Create `e2e/setup.ts` with auth fixture:
```typescript
// Login helper that can be reused across tests
async function loginAs(page, email, password) {
  await page.goto('/login');
  await page.fill('[name=email]', email);
  await page.fill('[name=password]', password);
  await page.click('button[type=submit]');
  await page.waitForURL('/dashboard');
}
```

4. **auth.spec.ts**:
   - Test login with valid credentials → redirects to dashboard
   - Test login with invalid credentials → shows error
   - Test logout → redirects to login
   - Test protected page redirect when not authenticated

5. **hypothesis-lifecycle.spec.ts**:
   - Login as initiator → create hypothesis → verify in list
   - Login as pd_manager → transition to scoring → verify status badge
   - Navigate to hypothesis detail → verify all tabs visible
   - Test search and filter on hypothesis list

6. **admin.spec.ts**:
   - Login as admin → navigate to admin/users → verify user list
   - Create new user → verify in list
   - Navigate to scoring thresholds → update → verify saved
   - Verify non-admin cannot access admin pages

#### TDD
These ARE the tests — E2E tests by definition.

#### Verify
```bash
npx playwright test
```

#### Acceptance Criteria
- [ ] Login/logout E2E test passes
- [ ] Hypothesis creation E2E test passes
- [ ] Hypothesis status transition visible in UI
- [ ] Admin page access control works
- [ ] All E2E tests pass in CI-like environment (Docker Compose up)

---

### Task T27: README + Environment Documentation

**Files:**
- `README.md` (create/overwrite)
- `backend/README.md` (new)
- `.env.example` (update)
- `backend/.env.example` (new)

**Depends on:** T01, T02
**Complexity:** S
**Risk:** LOW
**Input:** Working Docker Compose setup
**Output:** Complete setup instructions for new developers
**Rollback:** Revert README files

#### What to do

1. Create root `README.md` with:
   - Project overview (Product Tracker — what it does)
   - Architecture diagram (ASCII)
   - Prerequisites (Docker Desktop, Node 20)
   - Quick start: `cp .env.example .env && make up && make migrate && make fresh`
   - Development workflow: how to run frontend/backend separately
   - Testing: `make test-backend`, `npx vitest`, `npx playwright test`
   - Project structure explanation
   - Available Makefile commands

2. Create `backend/README.md` with:
   - Laravel-specific setup notes
   - API endpoint list (grouped by module)
   - Testing instructions
   - Database migration workflow

3. Update `.env.example` with all required variables documented with comments.

#### TDD
Skip TDD (documentation). Verify readability.

#### Verify
```bash
cat /Users/fenix007/projects/ai/product-tracker/README.md | head -50
```

#### Acceptance Criteria
- [ ] New developer can set up project by following README alone
- [ ] All environment variables documented
- [ ] API endpoints listed
- [ ] Makefile commands documented

---

## Dependency Graph

```
Wave 1 (parallel): T01, T27 — no dependencies
Wave 2 (sequential): T02 — depends on T01
Wave 3 (sequential): T03 — depends on T02
Wave 4 (sequential): T04 — depends on T03
Wave 5 (sequential): T05 — depends on T04
Wave 6 (parallel): T06, T08 — depend on T05
Wave 7 (parallel): T07, T09, T10, T11, T12, T13 — depend on T06 or T08
Wave 8 (parallel): T14, T15, T16, T18 — depend on T08/T09
Wave 9 (parallel): T17, T19, T20 — depend on Wave 8
Wave 10 (sequential): T21 — depends on T06
Wave 11 (parallel): T22, T23 — depend on T21
Wave 12 (sequential): T24 — depends on T22, T23
Wave 13 (parallel): T25, T26 — depend on all backend/frontend tasks
```

**Simplified wave view:**

```
Wave 1:  T01 ─────── T27
Wave 2:  T02
Wave 3:  T03
Wave 4:  T04
Wave 5:  T05
Wave 6:  T06 ──────── T08
Wave 7:  T07, T09, T10, T11, T12, T13
Wave 8:  T14, T15, T16, T18
Wave 9:  T17, T19, T20
Wave 10: T21
Wave 11: T22 ──────── T23
Wave 12: T24
Wave 13: T25 ──────── T26
```

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sanctum CSRF/cookie auth issues with separate frontend/backend domains | HIGH | Use `localhost` for both in dev; test CORS config early in T02; fallback to token-based auth if SPA cookies fail |
| Status machine complexity — DB-driven conditions may be hard to debug | MEDIUM | Comprehensive unit tests in T09; fallback to hardcoded map if needed |
| Effector learning curve for team unfamiliar with it | MEDIUM | Keep stores simple (effects + stores, no complex combinators); mock fallback pattern ensures partial progress |
| Docker Compose networking between frontend and backend | LOW | Use Docker network aliases; test connectivity in T01 |
| Large migration set may have ordering issues | LOW | Run `migrate:fresh` in tests; sequential numbered migrations |
| PDF generation quality with DomPDF | LOW | Use simple HTML layout; fallback to basic text-based PDF if rendering issues |
| Frontend TypeScript types diverging from backend API | MEDIUM | Generate types from API responses in T22; keep `lib/types.ts` as single source of truth |

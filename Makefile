up:
	docker compose up -d

down:
	docker compose down

backend-shell:
	docker compose exec backend sh

migrate:
	docker compose exec backend php artisan migrate

test-backend:
	docker compose exec backend php artisan test

fresh:
	docker compose exec backend php artisan migrate:fresh --seed

playwright-install:
	npx playwright install chromium

test-e2e: playwright-install
	BASE_URL=http://localhost:13000 npm run test:e2e

test-e2e-ui: playwright-install
	BASE_URL=http://localhost:13000 npm run test:e2e:ui

test-frontend:
	npm test

admin-reset-password:
	@if [ -z "$(ADMIN_PASSWORD)" ]; then \
		echo "Usage: make admin-reset-password ADMIN_PASSWORD=<new_password> [ADMIN_EMAIL=<admin_email>]"; \
		exit 1; \
	fi
	docker compose exec \
		-e ADMIN_EMAIL="$(ADMIN_EMAIL)" \
		-e ADMIN_PASSWORD="$(ADMIN_PASSWORD)" \
		backend php artisan tinker --execute='$$email = getenv("ADMIN_EMAIL"); $$password = getenv("ADMIN_PASSWORD"); $$query = \App\Models\User::query()->where("role", \App\Enums\UserRole::Admin->value); if ($$email) { $$admin = $$query->whereRaw("LOWER(email) = ?", [strtolower($$email)])->first(); } else { $$admin = $$query->orderBy("id")->first(); } if (!$$admin) { fwrite(STDERR, "Admin user not found. Run setup first or pass ADMIN_EMAIL." . PHP_EOL); exit(1); } $$admin->password = $$password; $$admin->save(); echo "Admin password updated for " . $$admin->email . PHP_EOL;'

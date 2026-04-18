ENV_FILE ?= .env

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
	@ADMIN_EMAIL="$(ADMIN_EMAIL)"; \
	ADMIN_PASSWORD="$(ADMIN_PASSWORD)"; \
	if [ -z "$$ADMIN_EMAIL" ]; then \
		ADMIN_EMAIL="$$(grep -E '^ADMIN_EMAIL=' .env 2>/dev/null | tail -n1 | cut -d '=' -f2-)"; \
	fi; \
	if [ -z "$$ADMIN_PASSWORD" ]; then \
		ADMIN_PASSWORD="$$(grep -E '^ADMIN_PASSWORD=' .env 2>/dev/null | tail -n1 | cut -d '=' -f2-)"; \
	fi; \
	if [ -z "$$ADMIN_PASSWORD" ]; then \
		echo "Set ADMIN_PASSWORD in .env or pass ADMIN_PASSWORD=<new_password>"; \
		exit 1; \
	fi; \
	if [ -n "$$ADMIN_EMAIL" ]; then \
		docker compose exec backend php artisan admin:reset-password "$$ADMIN_PASSWORD" --email="$$ADMIN_EMAIL"; \
	else \
		docker compose exec backend php artisan admin:reset-password "$$ADMIN_PASSWORD"; \
	fi

prod-up:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) up -d --build

prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) down

prod-deploy:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) up -d --build
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) exec backend php artisan migrate --force
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) ps

prod-update:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) up -d --build --no-deps backend
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) exec backend php artisan migrate --force
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) up -d --build --no-deps frontend
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $(ENV_FILE) ps

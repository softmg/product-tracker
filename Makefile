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

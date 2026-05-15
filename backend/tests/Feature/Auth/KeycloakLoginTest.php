<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class KeycloakLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_keycloak_redirect_sends_user_to_realm_authorization_endpoint(): void
    {
        $this->configureKeycloak();

        $response = $this->get('/api/v1/auth/keycloak/redirect');

        $location = (string) $response->headers->get('Location');

        $response->assertRedirect();
        $this->assertStringStartsWith('https://keycloak.test/realms/product-tracker/protocol/openid-connect/auth?', $location);
        $this->assertStringContainsString('client_id=product-tracker', $location);
        $this->assertStringContainsString('response_type=code', $location);
    }

    public function test_keycloak_callback_provisions_admin_and_logs_user_in(): void
    {
        $this->configureKeycloak([
            'keycloak.admin_emails' => ['admin@example.org'],
            'keycloak.frontend_url' => 'https://producttracker.test',
        ]);

        Http::fake([
            'https://keycloak.test/realms/product-tracker/protocol/openid-connect/token' => Http::response([
                'access_token' => 'access-token',
            ]),
            'https://keycloak.test/realms/product-tracker/protocol/openid-connect/userinfo' => Http::response([
                'sub' => 'keycloak-user-1',
                'email' => 'admin@example.org',
                'email_verified' => true,
                'name' => 'SSO Admin',
            ]),
        ]);

        $this
            ->withSession(['keycloak_oauth_state' => 'expected-state'])
            ->get('/api/v1/auth/keycloak/callback?code=auth-code&state=expected-state')
            ->assertRedirect('https://producttracker.test/dashboard');

        $user = User::query()->where('email', 'admin@example.org')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertSame(UserRole::Admin, $user->role);
        $this->assertSame('keycloak', $user->sso_provider);
        $this->assertSame('keycloak-user-1', $user->sso_subject);
        $this->assertNotNull($user->last_login_at);
    }

    public function test_keycloak_callback_provisions_role_from_realm_role_mapping(): void
    {
        $this->configureKeycloak();

        Http::fake([
            'https://keycloak.test/realms/product-tracker/protocol/openid-connect/token' => Http::response([
                'access_token' => $this->fakeJwt([
                    'realm_access' => [
                        'roles' => ['default-roles-product-tracker', 'producttracker-bizdev'],
                    ],
                ]),
            ]),
            'https://keycloak.test/realms/product-tracker/protocol/openid-connect/userinfo' => Http::response([
                'sub' => 'keycloak-user-2',
                'email' => 'bizdev@example.org',
                'email_verified' => true,
                'name' => 'SSO BizDev',
            ]),
        ]);

        $this
            ->withSession(['keycloak_oauth_state' => 'expected-state'])
            ->get('/api/v1/auth/keycloak/callback?code=auth-code&state=expected-state')
            ->assertRedirect('https://producttracker.test/dashboard');

        $user = User::query()->where('email', 'bizdev@example.org')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertSame(UserRole::BizDev, $user->role);
    }

    public function test_keycloak_callback_syncs_existing_user_role_from_role_mapping(): void
    {
        $this->configureKeycloak();

        $user = User::factory()->create([
            'email' => 'existing-bizdev@example.org',
            'role' => UserRole::Initiator,
        ]);

        Http::fake([
            'https://keycloak.test/realms/product-tracker/protocol/openid-connect/token' => Http::response([
                'access_token' => 'access-token',
            ]),
            'https://keycloak.test/realms/product-tracker/protocol/openid-connect/userinfo' => Http::response([
                'sub' => 'keycloak-user-3',
                'email' => 'existing-bizdev@example.org',
                'email_verified' => true,
                'name' => 'Existing BizDev',
                'resource_access' => [
                    'product-tracker' => [
                        'roles' => ['producttracker-bizdev'],
                    ],
                ],
            ]),
        ]);

        $this
            ->withSession(['keycloak_oauth_state' => 'expected-state'])
            ->get('/api/v1/auth/keycloak/callback?code=auth-code&state=expected-state')
            ->assertRedirect('https://producttracker.test/dashboard');

        $this->assertAuthenticatedAs($user->refresh());
        $this->assertSame(UserRole::BizDev, $user->role);
        $this->assertSame('keycloak', $user->sso_provider);
        $this->assertSame('keycloak-user-3', $user->sso_subject);
    }

    public function test_keycloak_callback_rejects_invalid_state(): void
    {
        $this->configureKeycloak([
            'keycloak.frontend_url' => 'https://producttracker.test',
        ]);

        $this
            ->withSession(['keycloak_oauth_state' => 'expected-state'])
            ->get('/api/v1/auth/keycloak/callback?code=auth-code&state=wrong-state')
            ->assertRedirect('https://producttracker.test/login?sso_error=sso_state');

        $this->assertGuest();
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function configureKeycloak(array $overrides = []): void
    {
        config([
            'keycloak.enabled' => true,
            'keycloak.base_url' => 'https://keycloak.test',
            'keycloak.realm' => 'product-tracker',
            'keycloak.client_id' => 'product-tracker',
            'keycloak.client_secret' => 'secret',
            'keycloak.redirect_uri' => 'https://producttracker.test/api/v1/auth/keycloak/callback',
            'keycloak.allowed_domains' => ['example.org'],
            'keycloak.admin_emails' => [],
            'keycloak.auto_provision' => true,
            'keycloak.default_role' => UserRole::Initiator->value,
            'keycloak.role_mappings' => [],
            'keycloak.require_verified_email' => false,
            'keycloak.frontend_url' => 'https://producttracker.test',
            ...$overrides,
        ]);
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function fakeJwt(array $claims): string
    {
        return implode('.', [
            $this->base64UrlEncode((string) json_encode(['alg' => 'none'])),
            $this->base64UrlEncode((string) json_encode($claims)),
            '',
        ]);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}

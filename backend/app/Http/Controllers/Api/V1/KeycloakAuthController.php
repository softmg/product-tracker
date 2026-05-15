<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class KeycloakAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->redirectToLogin('sso_not_configured');
        }

        $state = Str::random(40);
        $request->session()->put('keycloak_oauth_state', $state);

        $query = http_build_query([
            'client_id' => config('keycloak.client_id'),
            'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
        ], '', '&', PHP_QUERY_RFC3986);

        return redirect()->away($this->authUrl().'?'.$query);
    }

    public function callback(Request $request): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->redirectToLogin('sso_not_configured');
        }

        if ($request->filled('error')) {
            Log::warning('Keycloak returned an auth error', [
                'error' => $request->query('error'),
                'description' => $request->query('error_description'),
            ]);

            return $this->redirectToLogin('sso_denied');
        }

        $expectedState = $request->session()->pull('keycloak_oauth_state');
        $state = (string) $request->query('state', '');

        if (! is_string($expectedState) || $expectedState === '' || ! hash_equals($expectedState, $state)) {
            Log::warning('Keycloak state validation failed');

            return $this->redirectToLogin('sso_state');
        }

        $code = (string) $request->query('code', '');
        if ($code === '') {
            return $this->redirectToLogin('sso_missing_code');
        }

        $tokenResponse = Http::asForm()
            ->acceptJson()
            ->timeout(10)
            ->post($this->tokenUrl(), $this->tokenPayload($code));

        if ($tokenResponse->failed()) {
            Log::error('Keycloak token exchange failed', [
                'status' => $tokenResponse->status(),
                'body' => $tokenResponse->json(),
            ]);

            return $this->redirectToLogin('sso_token');
        }

        $accessToken = (string) $tokenResponse->json('access_token', '');
        if ($accessToken === '') {
            Log::error('Keycloak token response did not include access_token');

            return $this->redirectToLogin('sso_token');
        }

        $accessTokenClaims = $this->accessTokenClaims($accessToken);

        $userInfoResponse = Http::withToken($accessToken)
            ->acceptJson()
            ->timeout(10)
            ->get($this->userInfoUrl());

        if ($userInfoResponse->failed()) {
            Log::error('Keycloak userinfo request failed', [
                'status' => $userInfoResponse->status(),
                'body' => $userInfoResponse->json(),
            ]);

            return $this->redirectToLogin('sso_profile');
        }

        $claims = $userInfoResponse->json();
        if (! is_array($claims)) {
            return $this->redirectToLogin('sso_profile');
        }

        $claims = array_replace_recursive($accessTokenClaims, $claims);

        $user = $this->resolveUser($claims);
        if (! $user instanceof User) {
            return $this->redirectToLogin('sso_unauthorized');
        }

        if (! $user->is_active) {
            return $this->redirectToLogin('sso_inactive');
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return redirect()->away($this->frontendUrl('/dashboard'));
    }

    private function resolveUser(array $claims): ?User
    {
        $subject = $this->claimString($claims, 'sub');
        $email = strtolower($this->claimString($claims, 'email'));

        if ($subject === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::warning('Keycloak profile is missing required subject or email', [
                'has_subject' => $subject !== '',
                'email' => $email,
            ]);

            return null;
        }

        $emailVerified = (bool) ($claims['email_verified'] ?? false);
        if ((bool) config('keycloak.require_verified_email') && ! $emailVerified) {
            Log::warning('Keycloak profile rejected because email is not verified', ['email' => $email]);

            return null;
        }

        if (! $this->isAllowedEmail($email)) {
            Log::warning('Keycloak profile rejected by email domain allow-list', ['email' => $email]);

            return null;
        }

        $user = User::query()
            ->where(static function ($query) use ($subject, $email): void {
                $query
                    ->where(static function ($providerQuery) use ($subject): void {
                        $providerQuery
                            ->where('sso_provider', 'keycloak')
                            ->where('sso_subject', $subject);
                    })
                    ->orWhere('email', $email);
            })
            ->first();

        $attributes = [
            'name' => $this->displayName($claims, $email),
            'email' => $email,
            'email_verified_at' => $emailVerified ? now() : null,
            'sso_provider' => 'keycloak',
            'sso_subject' => $subject,
            'sso_last_login_at' => now(),
            'last_login_at' => now(),
        ];

        $ssoRole = $this->ssoRole($email, $claims);

        if ($user instanceof User) {
            if ($ssoRole instanceof UserRole) {
                $attributes['role'] = $ssoRole;
            }

            $user->fill($attributes);
            $user->save();

            return $user;
        }

        if (! (bool) config('keycloak.auto_provision')) {
            return null;
        }

        return User::query()->create([
            ...$attributes,
            'password' => Hash::make(Str::random(64)),
            'role' => $ssoRole ?? $this->defaultProvisionedRole(),
            'is_active' => true,
        ]);
    }

    private function ssoRole(string $email, array $claims): ?UserRole
    {
        $adminEmails = config('keycloak.admin_emails', []);
        if (is_array($adminEmails) && in_array(strtolower($email), $adminEmails, true)) {
            return UserRole::Admin;
        }

        return $this->mappedKeycloakRole($claims);
    }

    private function defaultProvisionedRole(): UserRole
    {
        return UserRole::tryFrom((string) config('keycloak.default_role')) ?? UserRole::Initiator;
    }

    private function mappedKeycloakRole(array $claims): ?UserRole
    {
        $claimRoles = $this->claimRoles($claims);
        if ($claimRoles === []) {
            return null;
        }

        foreach ($this->keycloakRoleMappings() as $keycloakRole => $userRole) {
            if (in_array($keycloakRole, $claimRoles, true)) {
                return $userRole;
            }
        }

        return null;
    }

    /**
     * @return array<string, UserRole>
     */
    private function keycloakRoleMappings(): array
    {
        $mappings = [];
        $configured = config('keycloak.role_mappings', []);

        if (is_array($configured)) {
            foreach ($configured as $externalRole => $userRole) {
                if (! is_scalar($externalRole) || ! is_scalar($userRole)) {
                    continue;
                }

                $role = UserRole::tryFrom(strtolower(trim((string) $userRole)));
                $externalRole = $this->normalizeRoleName((string) $externalRole);

                if ($role instanceof UserRole && $externalRole !== '') {
                    $mappings[$externalRole] = $role;
                }
            }
        }

        foreach ($this->defaultKeycloakRoleMappings() as $externalRole => $userRole) {
            $mappings[$externalRole] ??= $userRole;
        }

        return $mappings;
    }

    /**
     * @return array<string, UserRole>
     */
    private function defaultKeycloakRoleMappings(): array
    {
        return [
            'producttracker-admin' => UserRole::Admin,
            'producttracker-pd-manager' => UserRole::PdManager,
            'producttracker-pd_manager' => UserRole::PdManager,
            'producttracker-analyst' => UserRole::Analyst,
            'producttracker-tech-lead' => UserRole::TechLead,
            'producttracker-tech_lead' => UserRole::TechLead,
            'producttracker-bizdev' => UserRole::BizDev,
            'producttracker-committee' => UserRole::Committee,
            'producttracker-initiator' => UserRole::Initiator,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function claimRoles(array $claims): array
    {
        $roles = [];

        $this->appendRoleClaims($roles, $claims['roles'] ?? null);
        $this->appendRoleClaims($roles, $claims['groups'] ?? null);

        $realmAccess = $claims['realm_access'] ?? null;
        if (is_array($realmAccess)) {
            $this->appendRoleClaims($roles, $realmAccess['roles'] ?? null);
        }

        $resourceAccess = $claims['resource_access'] ?? null;
        if (is_array($resourceAccess)) {
            $clientId = (string) config('keycloak.client_id');
            if ($clientId !== '' && isset($resourceAccess[$clientId]) && is_array($resourceAccess[$clientId])) {
                $this->appendRoleClaims($roles, $resourceAccess[$clientId]['roles'] ?? null);
            }
        }

        return array_values(array_unique(array_filter($roles)));
    }

    /**
     * @param  array<int, string>  $roles
     */
    private function appendRoleClaims(array &$roles, mixed $value): void
    {
        if (! is_array($value)) {
            return;
        }

        foreach ($value as $role) {
            if (! is_scalar($role)) {
                continue;
            }

            $normalized = $this->normalizeRoleName((string) $role);
            if ($normalized !== '') {
                $roles[] = $normalized;
            }
        }
    }

    private function normalizeRoleName(string $role): string
    {
        $role = Str::of($role)->lower()->trim()->afterLast('/')->toString();

        return $role;
    }

    private function isAllowedEmail(string $email): bool
    {
        $domains = config('keycloak.allowed_domains', []);
        if (! is_array($domains) || $domains === []) {
            return true;
        }

        $domain = Str::of($email)->afterLast('@')->lower()->toString();

        return in_array($domain, $domains, true);
    }

    private function displayName(array $claims, string $email): string
    {
        foreach (['name', 'preferred_username'] as $claim) {
            $value = $this->claimString($claims, $claim);
            if ($value !== '') {
                return $value;
            }
        }

        return Str::before($email, '@');
    }

    private function claimString(array $claims, string $key): string
    {
        $value = $claims[$key] ?? '';

        return is_scalar($value) ? trim((string) $value) : '';
    }

    private function accessTokenClaims(string $accessToken): array
    {
        $parts = explode('.', $accessToken);
        if (count($parts) < 2) {
            return [];
        }

        $payload = strtr($parts[1], '-_', '+/');
        $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);

        $json = base64_decode($payload, true);
        if (! is_string($json)) {
            return [];
        }

        $claims = json_decode($json, true);

        return is_array($claims) ? $claims : [];
    }

    private function tokenPayload(string $code): array
    {
        $payload = [
            'grant_type' => 'authorization_code',
            'client_id' => config('keycloak.client_id'),
            'redirect_uri' => $this->redirectUri(),
            'code' => $code,
        ];

        $clientSecret = (string) config('keycloak.client_secret');
        if ($clientSecret !== '') {
            $payload['client_secret'] = $clientSecret;
        }

        return $payload;
    }

    private function isConfigured(): bool
    {
        return (bool) config('keycloak.enabled')
            && (string) config('keycloak.base_url') !== ''
            && (string) config('keycloak.realm') !== ''
            && (string) config('keycloak.client_id') !== '';
    }

    private function authUrl(): string
    {
        return $this->realmUrl().'/protocol/openid-connect/auth';
    }

    private function tokenUrl(): string
    {
        return $this->realmUrl().'/protocol/openid-connect/token';
    }

    private function userInfoUrl(): string
    {
        return $this->realmUrl().'/protocol/openid-connect/userinfo';
    }

    private function realmUrl(): string
    {
        return sprintf('%s/realms/%s', config('keycloak.base_url'), rawurlencode((string) config('keycloak.realm')));
    }

    private function redirectUri(): string
    {
        $configured = config('keycloak.redirect_uri');

        return is_string($configured) && $configured !== ''
            ? $configured
            : route('auth.keycloak.callback');
    }

    private function redirectToLogin(string $error): RedirectResponse
    {
        return redirect()->away($this->frontendUrl('/login', ['sso_error' => $error]));
    }

    /**
     * @param  array<string, string>  $query
     */
    private function frontendUrl(string $path, array $query = []): string
    {
        $baseUrl = rtrim((string) config('keycloak.frontend_url'), '/');
        if ($baseUrl === '') {
            $baseUrl = rtrim((string) config('app.url'), '/');
        }

        $url = $baseUrl.'/'.ltrim($path, '/');
        if ($query !== []) {
            $url .= '?'.http_build_query($query, '', '&', PHP_QUERY_RFC3986);
        }

        return $url;
    }
}

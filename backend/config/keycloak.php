<?php

declare(strict_types=1);

$csv = static function (string $key): array {
    $value = (string) env($key, '');

    return array_values(array_filter(array_map(
        static fn (string $item): string => strtolower(trim($item)),
        explode(',', $value),
    )));
};

$mappings = static function (string $key): array {
    $value = (string) env($key, '');
    $items = array_filter(array_map('trim', explode(',', $value)));
    $result = [];

    foreach ($items as $item) {
        [$externalRole, $userRole] = array_pad(explode('=', $item, 2), 2, '');
        $externalRole = strtolower(trim($externalRole));
        $userRole = strtolower(trim($userRole));

        if ($externalRole !== '' && $userRole !== '') {
            $result[$externalRole] = $userRole;
        }
    }

    return $result;
};

return [
    'enabled' => env('KEYCLOAK_ENABLED', false),
    'base_url' => rtrim((string) env('KEYCLOAK_BASE_URL', ''), '/'),
    'realm' => env('KEYCLOAK_REALM', ''),
    'client_id' => env('KEYCLOAK_CLIENT_ID', ''),
    'client_secret' => env('KEYCLOAK_CLIENT_SECRET', ''),
    'redirect_uri' => env('KEYCLOAK_REDIRECT_URI'),
    'frontend_url' => env('FRONTEND_URL', env('FRONTEND_PUBLIC_URL')),
    'allowed_domains' => $csv('KEYCLOAK_ALLOWED_DOMAINS'),
    'admin_emails' => $csv('KEYCLOAK_ADMIN_EMAILS'),
    'auto_provision' => env('KEYCLOAK_AUTO_PROVISION', true),
    'default_role' => env('KEYCLOAK_DEFAULT_ROLE', 'initiator'),
    'role_mappings' => $mappings('KEYCLOAK_ROLE_MAPPINGS'),
    'require_verified_email' => env('KEYCLOAK_REQUIRE_VERIFIED_EMAIL', false),
];

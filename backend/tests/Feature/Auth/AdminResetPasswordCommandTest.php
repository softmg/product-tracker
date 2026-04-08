<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminResetPasswordCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_resets_password_for_specific_admin_by_email(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@company.com',
            'role' => UserRole::Admin,
            'password' => 'old-password',
        ]);

        $this->artisan('admin:reset-password', [
            'password' => 'new-password-123',
            '--email' => 'admin@company.com',
        ])->assertSuccessful();

        $admin->refresh();

        $this->assertTrue(Hash::check('new-password-123', $admin->password));
    }

    public function test_command_resets_first_admin_password_when_email_not_provided(): void
    {
        $firstAdmin = User::factory()->create([
            'role' => UserRole::Admin,
            'password' => 'first-old-password',
        ]);

        $secondAdmin = User::factory()->create([
            'role' => UserRole::Admin,
            'password' => 'second-old-password',
        ]);

        $this->artisan('admin:reset-password', [
            'password' => 'new-password-123',
        ])->assertSuccessful();

        $firstAdmin->refresh();
        $secondAdmin->refresh();

        $this->assertTrue(Hash::check('new-password-123', $firstAdmin->password));
        $this->assertFalse(Hash::check('new-password-123', $secondAdmin->password));
    }

    public function test_command_fails_when_admin_not_found(): void
    {
        $this->artisan('admin:reset-password', [
            'password' => 'new-password-123',
            '--email' => 'missing-admin@company.com',
        ])->assertFailed();
    }

    public function test_password_reset_via_command_allows_login_with_new_password(): void
    {
        $this->postJson('/api/v1/setup/admin', [
            'name' => 'First Admin',
            'email' => 'admin@company.com',
            'password' => 'setup-password-123',
            'password_confirmation' => 'setup-password-123',
        ])->assertCreated();

        $this->artisan('admin:reset-password', [
            'password' => 'reset-password-456',
            '--email' => 'admin@company.com',
        ])->assertSuccessful();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@company.com',
            'password' => 'reset-password-456',
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@company.com')
            ->assertJsonPath('user.role', 'admin');
    }
}

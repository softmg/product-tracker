<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;

class ResetAdminPassword extends Command
{
    protected $signature = 'admin:reset-password {password} {--email=}';

    protected $description = 'Reset password for an admin user';

    public function handle(): int
    {
        /** @var string $password */
        $password = $this->argument('password');
        /** @var string|null $email */
        $email = $this->option('email');

        $query = User::query()->where('role', UserRole::Admin->value);

        if ($email !== null && $email !== '') {
            $admin = $query->whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
        } else {
            $admin = $query->orderBy('id')->first();
        }

        if (! $admin) {
            $this->error('Admin user not found. Run setup first or pass --email.');

            return self::FAILURE;
        }

        $admin->password = $password;
        $admin->save();

        $this->info(sprintf('Admin password updated for %s', $admin->email));

        return self::SUCCESS;
    }
}

<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $teams = Team::query()->pluck('id', 'name');

        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@company.com',
                'role' => UserRole::Admin,
                'team_id' => $teams['Product'] ?? null,
            ],
            [
                'name' => 'PD Manager',
                'email' => 'pd@company.com',
                'role' => UserRole::PdManager,
                'team_id' => $teams['Product'] ?? null,
            ],
            [
                'name' => 'Analyst User',
                'email' => 'analyst@company.com',
                'role' => UserRole::Analyst,
                'team_id' => $teams['Growth'] ?? null,
            ],
            [
                'name' => 'Tech Lead',
                'email' => 'techlead@company.com',
                'role' => UserRole::TechLead,
                'team_id' => $teams['Platform'] ?? null,
            ],
            [
                'name' => 'BizDev User',
                'email' => 'bizdev@company.com',
                'role' => UserRole::BizDev,
                'team_id' => $teams['Growth'] ?? null,
            ],
            [
                'name' => 'Committee User',
                'email' => 'committee@company.com',
                'role' => UserRole::Committee,
                'team_id' => $teams['Product'] ?? null,
            ],
            [
                'name' => 'Initiator User',
                'email' => 'initiator@company.com',
                'role' => UserRole::Initiator,
                'team_id' => $teams['Mobile'] ?? null,
            ],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make('password'),
                    'role' => $user['role'],
                    'team_id' => $user['team_id'],
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'last_login_at' => now(),
                ],
            );
        }
    }
}

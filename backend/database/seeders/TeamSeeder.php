<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Team;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    public function run(): void
    {
        $teams = [
            [
                'name' => 'Growth',
                'description' => 'Growth and acquisition team',
            ],
            [
                'name' => 'Product',
                'description' => 'Core product development',
            ],
            [
                'name' => 'Platform',
                'description' => 'Platform and infrastructure',
            ],
            [
                'name' => 'Mobile',
                'description' => 'Mobile applications',
            ],
        ];

        foreach ($teams as $team) {
            Team::query()->updateOrCreate(
                ['name' => $team['name']],
                $team,
            );
        }
    }
}

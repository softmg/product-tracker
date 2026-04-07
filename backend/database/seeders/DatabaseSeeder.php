<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            TeamSeeder::class,
            UserSeeder::class,
            StatusTransitionSeeder::class,
            ScoringCriteriaSeeder::class,
            ScoringThresholdSeeder::class,
            DeepDiveStageSeeder::class,
            SlaConfigSeeder::class,
            NotificationEventSeeder::class,
        ]);
    }
}

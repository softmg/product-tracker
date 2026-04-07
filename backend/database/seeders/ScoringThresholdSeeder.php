<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ScoringThresholdConfig;
use Illuminate\Database\Seeder;

class ScoringThresholdSeeder extends Seeder
{
    public function run(): void
    {
        ScoringThresholdConfig::query()->updateOrCreate(
            ['id' => 1],
            [
                'primary_threshold' => 7.00,
                'deep_threshold' => 7.00,
            ],
        );
    }
}

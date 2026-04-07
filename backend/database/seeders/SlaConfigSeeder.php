<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\HypothesisStatus;
use App\Models\SlaConfig;
use Illuminate\Database\Seeder;

class SlaConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            [
                'status' => HypothesisStatus::Backlog->value,
                'limit_days' => 14,
                'warning_days' => 10,
                'is_active' => true,
            ],
            [
                'status' => HypothesisStatus::Scoring->value,
                'limit_days' => 7,
                'warning_days' => 5,
                'is_active' => true,
            ],
            [
                'status' => HypothesisStatus::DeepDive->value,
                'limit_days' => 30,
                'warning_days' => 25,
                'is_active' => true,
            ],
            [
                'status' => HypothesisStatus::Experiment->value,
                'limit_days' => 30,
                'warning_days' => 25,
                'is_active' => true,
            ],
            [
                'status' => HypothesisStatus::GoNoGo->value,
                'limit_days' => 14,
                'warning_days' => 10,
                'is_active' => true,
            ],
        ];

        foreach ($configs as $config) {
            SlaConfig::query()->updateOrCreate(
                ['status' => $config['status']],
                [
                    'limit_days' => $config['limit_days'],
                    'warning_days' => $config['warning_days'],
                    'is_active' => $config['is_active'],
                ],
            );
        }
    }
}

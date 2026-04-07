<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DeepDiveStage;
use Illuminate\Database\Seeder;

class DeepDiveStageSeeder extends Seeder
{
    public function run(): void
    {
        $stages = [
            [
                'name' => 'Market & competitor research',
                'description' => 'Market landscape and competitor benchmarks',
                'order' => 1,
                'is_required' => true,
                'responsible_role' => 'analyst',
            ],
            [
                'name' => 'Respondent search',
                'description' => 'Search and qualification of target respondents',
                'order' => 2,
                'is_required' => true,
                'responsible_role' => 'initiator',
            ],
            [
                'name' => 'Interviews',
                'description' => 'Conduct 3-5 customer interviews',
                'order' => 3,
                'is_required' => true,
                'responsible_role' => 'pd_manager',
            ],
            [
                'name' => 'CJM / JBTD',
                'description' => 'Customer journey and jobs-to-be-done synthesis',
                'order' => 4,
                'is_required' => true,
                'responsible_role' => 'analyst',
            ],
            [
                'name' => 'Financial model',
                'description' => 'Revenue and cost model for hypothesis',
                'order' => 5,
                'is_required' => true,
                'responsible_role' => 'bizdev',
            ],
            [
                'name' => 'Resource estimation',
                'description' => 'Estimate implementation resources',
                'order' => 6,
                'is_required' => true,
                'responsible_role' => 'tech_lead',
            ],
            [
                'name' => 'Hypothesis passport',
                'description' => 'Final consolidated hypothesis passport',
                'order' => 7,
                'is_required' => true,
                'responsible_role' => 'pd_manager',
            ],
        ];

        foreach ($stages as $stage) {
            DeepDiveStage::query()->updateOrCreate(
                ['name' => $stage['name']],
                [
                    'description' => $stage['description'],
                    'order' => $stage['order'],
                    'is_required' => $stage['is_required'],
                    'responsible_role' => $stage['responsible_role'],
                    'is_active' => true,
                ],
            );
        }
    }
}

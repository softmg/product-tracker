<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\ScoringCriterion;
use App\Services\ScoringCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScoringCalculatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_calculates_weighted_average(): void
    {
        $firstCriterion = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 2.0,
            'is_stop_factor' => false,
            'input_type' => 'slider',
            'is_active' => true,
        ]);

        $secondCriterion = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 1.0,
            'is_stop_factor' => false,
            'input_type' => 'slider',
            'is_active' => true,
        ]);

        $result = (new ScoringCalculator())->calculate([
            $firstCriterion->id => 4,
            $secondCriterion->id => 2,
        ], 'primary');

        $this->assertEquals(3.33, $result['total_score']);
        $this->assertFalse($result['stop_factor_triggered']);
    }

    public function test_stop_factor_detected(): void
    {
        $mainCriterion = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 1.0,
            'is_stop_factor' => false,
            'input_type' => 'slider',
            'is_active' => true,
        ]);

        $stopFactorCriterion = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 0,
            'is_stop_factor' => true,
            'input_type' => 'checkbox',
            'is_active' => true,
        ]);

        $result = (new ScoringCalculator())->calculate([
            $mainCriterion->id => 4,
            $stopFactorCriterion->id => 1,
        ], 'primary');

        $this->assertTrue($result['stop_factor_triggered']);
    }

    public function test_number_type_normalization_with_thresholds(): void
    {
        $criterion = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 1.0,
            'is_stop_factor' => false,
            'input_type' => 'number',
            'thresholds' => [100, 500, 1000, 5000],
            'is_active' => true,
        ]);

        $result = (new ScoringCalculator())->calculate([
            $criterion->id => 600,
        ], 'primary');

        $this->assertEquals(3.0, $result['total_score']);
        $this->assertFalse($result['stop_factor_triggered']);
    }
}

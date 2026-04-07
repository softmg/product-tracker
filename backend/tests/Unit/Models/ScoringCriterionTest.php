<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\ScoringCriterion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScoringCriterionTest extends TestCase
{
    use RefreshDatabase;

    public function test_scoring_criterion_has_correct_casts(): void
    {
        $criterion = new ScoringCriterion();

        $this->assertArrayHasKey('weight', $criterion->getCasts());
        $this->assertArrayHasKey('thresholds', $criterion->getCasts());
        $this->assertArrayHasKey('is_active', $criterion->getCasts());
        $this->assertArrayHasKey('is_stop_factor', $criterion->getCasts());
    }

    public function test_scoring_criterion_casts_thresholds_to_array(): void
    {
        $criterion = ScoringCriterion::factory()->create([
            'thresholds' => ['warning' => 2, 'target' => 4],
        ]);

        $this->assertIsArray($criterion->thresholds);
        $this->assertSame(2, $criterion->thresholds['warning']);
        $this->assertSame(4, $criterion->thresholds['target']);
    }
}

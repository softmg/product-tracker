<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\Experiment;
use App\Models\ExperimentMetric;
use App\Models\Hypothesis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExperimentTest extends TestCase
{
    use RefreshDatabase;

    public function test_experiment_has_correct_casts(): void
    {
        $experiment = new Experiment();

        $this->assertArrayHasKey('start_date', $experiment->getCasts());
        $this->assertArrayHasKey('end_date', $experiment->getCasts());
    }

    public function test_experiment_has_required_relationships(): void
    {
        $hypothesis = Hypothesis::factory()->create();
        $createdBy = User::factory()->create();
        $responsible = User::factory()->create();

        $experiment = Experiment::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'created_by' => $createdBy->id,
            'responsible_user_id' => $responsible->id,
        ]);

        $this->assertSame($hypothesis->id, $experiment->hypothesis->id);
        $this->assertSame($createdBy->id, $experiment->createdBy->id);
        $this->assertSame($responsible->id, $experiment->responsibleUser->id);
    }

    public function test_experiment_has_many_metrics(): void
    {
        $experiment = Experiment::factory()->create();

        ExperimentMetric::factory()->create([
            'experiment_id' => $experiment->id,
        ]);

        $this->assertCount(1, $experiment->fresh()->metrics);
    }
}

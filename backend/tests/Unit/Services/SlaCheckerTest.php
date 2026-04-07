<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Enums\HypothesisStatus;
use App\Events\SlaViolation;
use App\Events\SlaWarning;
use App\Models\Hypothesis;
use App\Models\SlaConfig;
use App\Services\SlaChecker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SlaCheckerTest extends TestCase
{
    use RefreshDatabase;

    public function test_detects_sla_violation(): void
    {
        Event::fake([SlaViolation::class, SlaWarning::class]);

        SlaConfig::query()->create([
            'status' => HypothesisStatus::Scoring,
            'limit_days' => 7,
            'warning_days' => 2,
            'is_active' => true,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Scoring,
            'sla_deadline' => now()->subDay(),
            'sla_status' => 'ok',
        ]);

        $result = (new SlaChecker())->check();

        $this->assertSame(1, $result['violations']);
        $this->assertSame(0, $result['warnings']);
        $this->assertSame('violated', $hypothesis->fresh()->sla_status);

        Event::assertDispatched(SlaViolation::class);
        Event::assertNotDispatched(SlaWarning::class);
    }

    public function test_detects_sla_warning(): void
    {
        Event::fake([SlaViolation::class, SlaWarning::class]);

        SlaConfig::query()->create([
            'status' => HypothesisStatus::Scoring,
            'limit_days' => 7,
            'warning_days' => 2,
            'is_active' => true,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Scoring,
            'sla_deadline' => now()->addDay(),
            'sla_status' => 'ok',
        ]);

        $result = (new SlaChecker())->check();

        $this->assertSame(0, $result['violations']);
        $this->assertSame(1, $result['warnings']);
        $this->assertSame('warning', $hypothesis->fresh()->sla_status);

        Event::assertDispatched(SlaWarning::class);
        Event::assertNotDispatched(SlaViolation::class);
    }

    public function test_ignores_done_and_archived_hypotheses(): void
    {
        Event::fake([SlaViolation::class, SlaWarning::class]);

        SlaConfig::query()->create([
            'status' => HypothesisStatus::Done,
            'limit_days' => 7,
            'warning_days' => 2,
            'is_active' => true,
        ]);

        Hypothesis::factory()->create([
            'status' => HypothesisStatus::Done,
            'sla_deadline' => now()->subWeek(),
            'sla_status' => 'ok',
        ]);

        Hypothesis::factory()->create([
            'status' => HypothesisStatus::Archived,
            'sla_deadline' => now()->subWeek(),
            'sla_status' => 'ok',
        ]);

        $result = (new SlaChecker())->check();

        $this->assertSame(0, $result['violations']);
        $this->assertSame(0, $result['warnings']);

        Event::assertNotDispatched(SlaWarning::class);
        Event::assertNotDispatched(SlaViolation::class);
    }
}

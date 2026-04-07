<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HypothesisScoring extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'hypothesis_id',
        'stage',
        'criteria_scores',
        'total_score',
        'stop_factor_triggered',
        'scored_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'criteria_scores' => 'array',
            'total_score' => 'decimal:2',
            'stop_factor_triggered' => 'boolean',
        ];
    }

    public function hypothesis(): BelongsTo
    {
        return $this->belongsTo(Hypothesis::class);
    }

    public function scoredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scored_by');
    }
}

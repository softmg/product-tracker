<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScoringCriterion extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'input_type',
        'min_value',
        'max_value',
        'weight',
        'is_active',
        'thresholds',
        'is_stop_factor',
        'stage',
        'order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'min_value' => 'integer',
            'max_value' => 'integer',
            'weight' => 'decimal:2',
            'is_active' => 'boolean',
            'thresholds' => 'array',
            'is_stop_factor' => 'boolean',
            'order' => 'integer',
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScoringThresholdConfig extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'primary_threshold',
        'deep_threshold',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'primary_threshold' => 'decimal:2',
            'deep_threshold' => 'decimal:2',
        ];
    }
}

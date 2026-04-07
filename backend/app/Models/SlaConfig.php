<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\HypothesisStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SlaConfig extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'status',
        'limit_days',
        'warning_days',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => HypothesisStatus::class,
            'is_active' => 'boolean',
        ];
    }
}

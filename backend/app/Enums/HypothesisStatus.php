<?php

declare(strict_types=1);

namespace App\Enums;

enum HypothesisStatus: string
{
    case Backlog = 'backlog';
    case Scoring = 'scoring';
    case DeepDive = 'deep_dive';
    case Experiment = 'experiment';
    case GoNoGo = 'go_no_go';
    case Done = 'done';
    case Archived = 'archived';
}

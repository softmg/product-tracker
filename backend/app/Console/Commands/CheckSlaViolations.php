<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\SlaChecker;
use Illuminate\Console\Command;

class CheckSlaViolations extends Command
{
    protected $signature = 'sla:check';

    protected $description = 'Check SLA warnings and violations for hypotheses';

    public function handle(SlaChecker $slaChecker): int
    {
        $result = $slaChecker->check();

        $this->info(sprintf(
            'SLA check completed. warnings=%d violations=%d',
            $result['warnings'],
            $result['violations'],
        ));

        return self::SUCCESS;
    }
}

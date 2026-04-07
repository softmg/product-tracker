<?php

namespace App\Providers;

use App\Models\Experiment;
use App\Models\Hypothesis;
use App\Observers\ExperimentObserver;
use App\Observers\HypothesisObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        Hypothesis::observe(HypothesisObserver::class);
        Experiment::observe(ExperimentObserver::class);
    }
}

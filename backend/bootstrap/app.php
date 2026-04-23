<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->redirectGuestsTo(function ($request) {
            return $request->is('api/*') ? null : route('login');
        });
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function ($request, \Throwable $e): bool {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, $request) {
            if ($e->getStatusCode() !== 500 || ! $request->is('sanctum/csrf-cookie')) {
                return null;
            }

            $previous = $e->getPrevious();

            logger()->error('sanctum csrf 500', [
                'host' => $request->getHost(),
                'path' => $request->path(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
                'previous_exception' => $previous ? $previous::class : null,
                'previous_message' => $previous?->getMessage(),
                'previous_file' => $previous ? $previous->getFile().':'.$previous->getLine() : null,
                'session_driver' => config('session.driver'),
                'session_connection' => config('session.connection'),
                'redis_host' => config('database.redis.default.host'),
                'app_key_set' => filled(config('app.key')),
            ]);

            return null;
        });
    })->create();

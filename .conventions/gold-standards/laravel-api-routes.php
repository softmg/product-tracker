<?php

// Gold Standard: Laravel API v1 routing grouped by prefix and middleware
// Pay attention to: Route::prefix, auth boundary placement, resourceful naming, nested hypothesis actions

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HypothesisController;
use App\Http\Controllers\Api\V1\HypothesisStatusController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('hypotheses', HypothesisController::class);
        Route::get('hypotheses/{hypothesis}/transitions', [HypothesisStatusController::class, 'transitions']);
        Route::post('hypotheses/{hypothesis}/transition', [HypothesisStatusController::class, 'transition']);
        Route::get('hypotheses/{hypothesis}/scoring/{stage}', [HypothesisStatusController::class, 'show']);
        Route::post('hypotheses/{hypothesis}/scoring/{stage}', [HypothesisStatusController::class, 'submit']);
    });
});

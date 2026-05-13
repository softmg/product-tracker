<?php

use App\Http\Controllers\Api\V1\KeycloakAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api/v1/auth/keycloak')->name('auth.keycloak.')->group(function (): void {
    Route::get('/redirect', [KeycloakAuthController::class, 'redirect'])->name('redirect');
    Route::get('/callback', [KeycloakAuthController::class, 'callback'])->name('callback');
});

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('sso_provider')->nullable()->after('password');
            $table->string('sso_subject')->nullable()->after('sso_provider');
            $table->timestamp('sso_last_login_at')->nullable()->after('last_login_at');

            $table->unique(['sso_provider', 'sso_subject']);
            $table->index('sso_provider');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['sso_provider', 'sso_subject']);
            $table->dropIndex(['sso_provider']);
            $table->dropColumn(['sso_provider', 'sso_subject', 'sso_last_login_at']);
        });
    }
};

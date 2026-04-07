<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('scoring_threshold_configs', function (Blueprint $table) {
            $table->id();
            $table->decimal('primary_threshold', 5, 2)->default(7.0);
            $table->decimal('deep_threshold', 5, 2)->default(7.0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scoring_threshold_configs');
    }
};

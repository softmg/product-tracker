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
        Schema::create('scoring_criteria', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('input_type')->default('slider');
            $table->integer('min_value')->default(1);
            $table->integer('max_value')->default(5);
            $table->decimal('weight', 5, 2)->default(1.0);
            $table->boolean('is_active')->default(true);
            $table->jsonb('thresholds')->nullable();
            $table->boolean('is_stop_factor')->default(false);
            $table->string('stage')->default('primary');
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index('stage');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scoring_criteria');
    }
};

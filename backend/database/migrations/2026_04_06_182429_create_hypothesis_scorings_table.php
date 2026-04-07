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
        Schema::create('hypothesis_scorings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hypothesis_id')->constrained('hypotheses')->cascadeOnDelete();
            $table->string('stage');
            $table->jsonb('criteria_scores');
            $table->decimal('total_score', 5, 2);
            $table->boolean('stop_factor_triggered')->default(false);
            $table->foreignId('scored_by')->constrained('users');
            $table->timestamps();

            $table->unique(['hypothesis_id', 'stage']);
            $table->index('scored_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hypothesis_scorings');
    }
};

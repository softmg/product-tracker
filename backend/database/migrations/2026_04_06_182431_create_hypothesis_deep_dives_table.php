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
        Schema::create('hypothesis_deep_dives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hypothesis_id')->constrained('hypotheses')->cascadeOnDelete();
            $table->foreignId('stage_id')->constrained('deep_dive_stages');
            $table->boolean('is_completed')->default(false);
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->jsonb('comments')->default('[]');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['hypothesis_id', 'stage_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hypothesis_deep_dives');
    }
};

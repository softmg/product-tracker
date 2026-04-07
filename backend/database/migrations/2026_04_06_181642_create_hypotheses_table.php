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
        Schema::create('hypotheses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('problem')->nullable();
            $table->text('solution')->nullable();
            $table->text('assumptions')->nullable();
            $table->text('target_audience')->nullable();
            $table->string('status')->default('backlog');
            $table->string('priority')->default('medium');
            $table->foreignId('initiator_id')->constrained('users');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->decimal('scoring_primary', 5, 2)->nullable();
            $table->decimal('scoring_deep', 5, 2)->nullable();
            $table->timestamp('sla_deadline')->nullable();
            $table->string('sla_status')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('initiator_id');
            $table->index('owner_id');
            $table->index('team_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hypotheses');
    }
};

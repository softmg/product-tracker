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
        Schema::create('committee_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hypothesis_id')->constrained('hypotheses')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('committee_members')->cascadeOnDelete();
            $table->string('vote')->nullable();
            $table->text('comment')->nullable();
            $table->timestamp('voted_at')->nullable();
            $table->timestamps();

            $table->unique(['hypothesis_id', 'member_id']);
            $table->index('vote');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('committee_votes');
    }
};

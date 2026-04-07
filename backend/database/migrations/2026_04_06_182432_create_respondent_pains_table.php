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
        Schema::create('respondent_pains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('respondent_id')->constrained('respondents')->cascadeOnDelete();
            $table->string('tag');
            $table->text('quote')->nullable();
            $table->timestamps();

            $table->index('tag');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('respondent_pains');
    }
};

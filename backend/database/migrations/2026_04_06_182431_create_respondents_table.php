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
        Schema::create('respondents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hypothesis_id')->constrained('hypotheses')->cascadeOnDelete();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('position')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('contact_source')->nullable();
            $table->string('status')->default('new');
            $table->timestamp('interview_date')->nullable();
            $table->integer('interview_duration')->nullable();
            $table->foreignId('interviewer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('interview_format')->nullable();
            $table->string('recording_url')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('respondents');
    }
};

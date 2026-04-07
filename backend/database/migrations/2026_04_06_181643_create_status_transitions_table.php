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
        Schema::create('status_transitions', function (Blueprint $table) {
            $table->id();
            $table->string('from_status');
            $table->string('to_status');
            $table->jsonb('allowed_roles')->default('[]');
            $table->string('condition_type')->default('none');
            $table->string('condition_value')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['from_status', 'to_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status_transitions');
    }
};

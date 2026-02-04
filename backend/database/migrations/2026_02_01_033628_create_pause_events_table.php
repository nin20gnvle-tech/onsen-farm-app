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
    Schema::create('pause_events', function (Blueprint $table) {
        $table->id();

        $table->foreignId('work_log_id')
              ->constrained('work_logs')
              ->cascadeOnDelete();

        $table->foreignId('user_id')
              ->constrained()
              ->cascadeOnDelete();

        $table->enum('action', ['pause', 'resume']);
        $table->dateTime('at');

        $table->timestamps();

        $table->index(['work_log_id', 'at']);
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pause_events');
    }
};

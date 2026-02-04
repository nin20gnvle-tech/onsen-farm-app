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
    Schema::create('work_logs', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->foreignId('field_id')->constrained('fields')->restrictOnDelete();
        $table->foreignId('task_type_id')->constrained('task_types')->restrictOnDelete();
        $table->foreignId('product_id')->nullable()
              ->constrained('products')->nullOnDelete();

        $table->enum('status', ['running', 'paused', 'done']);

        $table->dateTime('started_at');
        $table->dateTime('paused_at')->nullable();
        $table->dateTime('ended_at')->nullable();

        $table->decimal('quantity', 10, 2)->nullable();
        $table->string('unit')->nullable();
        $table->text('memo')->nullable();

        $table->string('measure_type')->nullable();
        $table->decimal('measure_value', 10, 2)->nullable();
        $table->dateTime('measured_at')->nullable();

        $table->timestamps();

        $table->index(['status', 'started_at']);
        $table->index(['field_id', 'started_at']);
        $table->index(['user_id', 'started_at']);
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_logs');
    }
};

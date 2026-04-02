<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->onDelete('cascade');
            $table->enum('activity_type', [
                'preaching_lesson',
                'scientific_lesson',
                'sermon',
                'tour',
                'forum',
                'media',
                'visit',
                'reform',
                'other'
            ]);
            $table->date('execution_date');
            $table->text('details');
            $table->string('target_audience')->nullable();
            $table->string('location')->nullable();
            $table->integer('beneficiaries_count')->default(0);
            $table->string('tour_responsible')->nullable();
            $table->string('coordination_responsible')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};

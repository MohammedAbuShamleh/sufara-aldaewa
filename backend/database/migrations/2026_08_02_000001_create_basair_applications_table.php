<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('basair_applications', function (Blueprint $table) {
            $table->id();

            $table->string('full_name', 150);
            $table->enum('gender', ['male', 'female']);
            $table->string('national_id', 9)->unique();
            $table->date('birth_date');
            $table->enum('marital_status', ['single', 'married', 'widowed']);

            $table->string('phone', 20);
            $table->string('whatsapp', 25);
            $table->string('email', 150);

            $table->string('origin_governorate', 30);
            $table->string('origin_address', 255);
            $table->string('current_governorate', 30);
            $table->string('current_address', 255);
            $table->string('qualification', 150);

            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->string('ip_address', 45)->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('current_governorate');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('basair_applications');
    }
};

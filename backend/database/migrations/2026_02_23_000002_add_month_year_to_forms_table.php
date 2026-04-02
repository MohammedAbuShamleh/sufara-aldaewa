<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->unsignedTinyInteger('month')->nullable()->after('sub_region'); // 1-12
            $table->unsignedSmallInteger('year')->nullable()->after('month'); // e.g. 2026
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn(['month', 'year']);
        });
    }
};

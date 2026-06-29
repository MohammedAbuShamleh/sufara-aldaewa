<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // نوع البرنامج المشترك فيه الداعية: scientific (علمي) | dawah (دعوي)
            $table->string('program_type')->nullable()->after('governorate');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('program_type');
        });
    }
};

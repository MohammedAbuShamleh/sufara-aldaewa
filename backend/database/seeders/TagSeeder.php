<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;

/**
 * بذور الصفات (Tags) — الصفات المعتمدة. idempotent عبر updateOrCreate على الاسم.
 */
class TagSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Tag::SEED_NAMES as $name) {
            Tag::updateOrCreate(['name' => $name]);
        }
    }
}

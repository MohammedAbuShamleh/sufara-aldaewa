<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * صفة تصنيفية (Tag) — تصنيف متعدد للمستخدم لأغراض الفرز والفلترة فقط.
 * لا تمنح أي صلاحية؛ الرؤية محكومة بالدور (User::role) وحده.
 */
class Tag extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    /** الصفات الاثنتا عشرة المعتمدة (تُزرع عبر البذور). */
    public const SEED_NAMES = [
        'عضو فريق',
        'عضو فريق – جولات',
        'مسؤول فريق',
        'إداري',
        'مسؤول ملف الخطب',
        'مسؤول ملف دعوي',
        'مسؤول ملف علمي',
        'مسؤول الدائرة العلمية بالمحافظة',
        'مسؤول الدائرة الدعوية المركزية',
        'مسؤول الدائرة الدعوية بالمحافظة',
        'مسؤول الدائرة العلمية المركزية',
        'إعلامي',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}

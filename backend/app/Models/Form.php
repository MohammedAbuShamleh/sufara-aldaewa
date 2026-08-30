<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Form extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'preacher_name',
        'sub_region',
        'month',
        'year',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'year' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    /**
     * تقييد التقارير (النماذج) إلى ما يقع ضمن نطاق رؤية العارض.
     * يعتمد على بيانات الداعية صاحب النموذج (المحافظة / الفريق) كمصدر للحقيقة.
     */
    public function scopeVisibleTo(Builder $query, User $viewer): Builder
    {
        if ($viewer->canViewAllReports()) {
            return $query;
        }

        return $query->whereHas('user', function (Builder $q) use ($viewer) {
            $q->visibleToViewer($viewer);
        });
    }

    /** فحص إمكانية وصول عارض لنموذج مفرد (للتصدير المفرد والعرض والحذف). */
    public function isVisibleTo(User $viewer): bool
    {
        if ($viewer->canViewAllReports()) {
            return true;
        }

        if ($viewer->id === $this->user_id) {
            return true;
        }

        $owner = $this->relationLoaded('user') ? $this->user : $this->user()->first();
        if (! $owner) {
            return false;
        }

        if ($viewer->role === User::ROLE_GOVERNORATE_MANAGER) {
            return in_array($owner->governorate, $viewer->scopedGovernorates(), true);
        }

        if ($viewer->role === User::ROLE_TEAM_LEADER) {
            return $owner->governorate === $viewer->governorate
                && $owner->region === $viewer->region;
        }

        return false;
    }
}

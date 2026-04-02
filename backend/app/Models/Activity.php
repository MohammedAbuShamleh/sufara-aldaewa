<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_id',
        'activity_type',
        'execution_date',
        'details',
        'target_audience',
        'location',
        'beneficiaries_count',
        'tour_responsible',
        'coordination_responsible',
    ];

    protected $casts = [
        'execution_date' => 'date',
        'beneficiaries_count' => 'integer',
    ];

    public function form()
    {
        return $this->belongsTo(Form::class);
    }

    public static function getActivityTypes(): array
    {
        return [
            'preaching_lesson' => 'دروس وعظية',
            'scientific_lesson' => 'دروس علمية',
            'sermon' => 'خطب',
            'tour' => 'جولات',
            'forum' => 'ملتقيات',
            'media' => 'أنشطة إعلامية',
            'visit' => 'زيارات',
            'reform' => 'إصلاح',
            'other' => 'أخرى',
        ];
    }
}

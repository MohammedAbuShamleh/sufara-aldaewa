<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BasairApplication extends Model
{
    protected $fillable = [
        'full_name', 'gender', 'national_id', 'birth_date', 'marital_status',
        'phone', 'whatsapp', 'email',
        'origin_governorate', 'origin_address',
        'current_governorate', 'current_address',
        'qualification', 'ip_address',
        'status', 'admin_note',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function getGenderLabelAttribute(): string
    {
        return $this->gender === 'male' ? 'ذكر' : 'أنثى';
    }

    public function getMaritalLabelAttribute(): string
    {
        return match ($this->marital_status) {
            'married' => 'متزوج',
            'widowed' => 'أرمل',
            default   => 'أعزب',
        };
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ردّ مستخدم على نسخة محددة من عقد الكفالة — موافقة أو رفض.
 * سجل إثبات: لا يُحذف بعد إنشائه إلا بحذف المستخدم نفسه، ولا يتغير
 * إلا حين يعدل المستخدم عن رفضه فيوافق.
 */
class ContractResponse extends Model
{
    use HasFactory;

    public const DECISION_AGREED = 'agreed';
    public const DECISION_DECLINED = 'declined';

    public const DECISIONS = [self::DECISION_AGREED, self::DECISION_DECLINED];

    protected $fillable = [
        'user_id',
        'contract_version',
        'decision',
        'responded_at',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'responded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isAgreed(): bool
    {
        return $this->decision === self::DECISION_AGREED;
    }

    public function isDeclined(): bool
    {
        return $this->decision === self::DECISION_DECLINED;
    }
}

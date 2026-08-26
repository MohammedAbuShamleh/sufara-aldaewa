<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * يمنع الوصول إلى بيانات النظام قبل الموافقة على النسخة الحالية من عقد الكفالة.
 *
 * حجب الواجهة وحده لا يكفي: التوكن يصلح لاستدعاء الـ API مباشرةً، فلولا هذا
 * الفلتر لتمكّن من رفض العقد (أو لم يردّ عليه) من قراءة النماذج والأنشطة وتعديلها.
 *
 * تبقى خارج الحجب مسارات العقد نفسها و/user و/logout، حتى يستطيع المستخدم
 * قراءة العقد والردّ عليه — أو العدول عن رفضه — والخروج.
 */
class EnsureContractAgreed
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->hasAgreedToContract()) {
            return response()->json([
                'message' => 'يجب الموافقة على عقد الكفالة قبل استخدام النظام.',
                'contract_required' => true,
                'contract_decision' => $user->contractDecision(),
            ], 403);
        }

        return $next($request);
    }
}

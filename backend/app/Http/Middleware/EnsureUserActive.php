<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * يمنع الحسابات المعطّلة من استخدام النظام.
 *
 * منع الدخول في شاشة تسجيل الدخول وحده لا يكفي: التوكن الصادر قبل التعطيل يبقى
 * صالحاً لاستدعاء الـ API مباشرةً. نُبطل توكنات المستخدم عند تعطيله، ويبقى هذا
 * الفلتر شبكة أمان ثانية لأي توكن أفلت (تعطيل مباشر من قاعدة البيانات مثلاً).
 *
 * يبقى /logout خارج الحجب حتى يستطيع صاحب الحساب إنهاء جلسته.
 */
class EnsureUserActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isActive()) {
            return response()->json([
                'message' => 'تم تعطيل هذا الحساب. يرجى مراجعة الإدارة.',
                'account_disabled' => true,
            ], 403);
        }

        return $next($request);
    }
}

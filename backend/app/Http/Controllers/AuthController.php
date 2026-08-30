<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
             'id_number' => 'required_without:email|nullable|string',
            'email' => 'required_without:id_number|nullable|email',
            'password' => 'required',
        ]);

        $user = null;
        if ($request->filled('id_number')) {
            $user = User::where('id_number', $request->id_number)->first();
        } elseif ($request->filled('email')) {
            $user = User::where('email', $request->email)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([ 
                'id_number' => ['رقم الهوية أو البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
            ]);
        }

        // الحساب المعطّل لا يدخل النظام — نتحقق بعد كلمة المرور حتى لا نكشف
        // حالة الحسابات لمن لا يملك بياناتها.
        if (! $user->isActive()) {
            return response()->json([
                'message' => 'تم تعطيل هذا الحساب. يرجى مراجعة الإدارة.',
                'account_disabled' => true,
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($this->userPayload($request->user()));
    }

    /**
     * بيانات المستخدم كما تحتاجها الواجهة، مضافاً إليها قراره تجاه النسخة الحالية
     * من عقد الكفالة — حتى تعرف الواجهة فوراً هل تحجبه على شاشة العقد.
     */
    private function userPayload(User $user): array
    {
        $user->loadMissing('contractResponses');
        $response = $user->currentContractResponse();

        // لا حاجة لإرسال سجل الردود كاملاً مع بيانات المستخدم — يكفي القرار وتاريخه.
        $user->unsetRelation('contractResponses');

        return $user->toArray() + [
            'is_active' => $user->isActive(),
            'contract_decision' => $response?->decision ?? User::CONTRACT_PENDING,
            'contract_agreed' => $response?->isAgreed() ?? false,
            'contract_responded_at' => $response?->responded_at?->toIso8601String(),
        ];
    }

    public function updateMyNotes(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'notes' => 'nullable|string|max:5000',
        ]);
        $user->update(['notes' => $validated['notes'] ?? null]);
        return response()->json(['message' => 'تم حفظ الملاحظات', 'notes' => $user->notes]);
    }
}

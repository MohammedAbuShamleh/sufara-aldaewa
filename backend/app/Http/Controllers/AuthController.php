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

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
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
        return response()->json($request->user());
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

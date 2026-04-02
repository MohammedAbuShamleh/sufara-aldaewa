<?php

namespace App\Http\Controllers;

use App\Models\Form;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FormController extends Controller
{
    /**
     * نموذج الشهر الحالي فقط للمستخدم المسجّل. إن لم يوجد يُنشأ فارغاً.
     */
    public function myForm(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $month = (int) date('n');
        $year = (int) date('Y');

        $form = Form::where('user_id', $user->id)
            ->where('month', $month)
            ->where('year', $year)
            ->with('activities')
            ->first();

        if (!$form) {
            $form = Form::create([
                'user_id' => $user->id,
                'preacher_name' => $user->name,
                'sub_region' => $user->region,
                'month' => $month,
                'year' => $year,
            ]);
            $form->load('activities');
        }

        return response()->json($form);
    }

    public function index(Request $request)
    {
        $query = Form::with(['user', 'activities']);

        if ($request->has('preacher_name')) {
            $query->where('preacher_name', 'like', '%' . $request->preacher_name . '%');
        }

        if ($request->has('sub_region')) {
            $query->where('sub_region', 'like', '%' . $request->sub_region . '%');
        }

        $forms = $query->orderBy('created_at', 'desc')->get();

        return response()->json($forms);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            $validated = $request->validate([
                'preacher_name' => 'required|string|max:255',
                'sub_region' => 'nullable|string|max:255',
            ]);

            $month = (int) date('n');
            $year = (int) date('Y');

            $form = Form::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'month' => $month,
                    'year' => $year,
                ],
                [
                    'preacher_name' => $validated['preacher_name'],
                    'sub_region' => $validated['sub_region'] ?? null,
                ]
            );

            return response()->json($form->load('activities'), 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating form: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            
            return response()->json([
                'message' => 'حدث خطأ أثناء حفظ النموذج',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function show(Request $request, Form $form)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if ($form->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json($form->load(['user', 'activities']));
    }

    public function update(Request $request, Form $form)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if ($form->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'preacher_name' => 'sometimes|string|max:255',
            'sub_region' => 'nullable|string|max:255',
        ]);

        $form->update($validated);

        return response()->json($form->load('activities'));
    }

    public function destroy(Request $request, Form $form)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if ($form->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $form->delete();
        return response()->json(['message' => 'Form deleted successfully']);
    }
}

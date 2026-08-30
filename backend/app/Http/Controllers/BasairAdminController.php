<?php

namespace App\Http\Controllers;

use App\Models\BasairApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BasairAdminController extends Controller
{
    private function guard(Request $request): void
    {
        $token = $request->header('X-Basair-Token') ?: $request->query('token');
        $valid = config('app.basair_admin_token') ?: env('BASAIR_ADMIN_TOKEN');

        abort_if(!$valid || !$token || !hash_equals($valid, $token), 401, 'غير مصرّح.');
    }

    public function index(Request $request): JsonResponse
    {
        $this->guard($request);

        $q = BasairApplication::query();

        if ($s = trim((string) $request->query('search'))) {
            $q->where(function ($w) use ($s) {
                $w->where('full_name', 'like', "%$s%")
                  ->orWhere('national_id', 'like', "%$s%")
                  ->orWhere('phone', 'like', "%$s%")
                  ->orWhere('whatsapp', 'like', "%$s%");
            });
        }

        foreach (['status', 'gender', 'marital_status', 'current_governorate'] as $f) {
            if ($v = $request->query($f)) {
                $q->where($f, $v);
            }
        }

        $stats = [
            'total'    => BasairApplication::count(),
            'pending'  => BasairApplication::where('status', 'pending')->count(),
            'accepted' => BasairApplication::where('status', 'accepted')->count(),
            'rejected' => BasairApplication::where('status', 'rejected')->count(),
            'male'     => BasairApplication::where('gender', 'male')->count(),
            'female'   => BasairApplication::where('gender', 'female')->count(),
        ];

        $page = $q->orderByDesc('id')->paginate(
            min((int) $request->query('per_page', 25), 100)
        );

        return response()->json(['stats' => $stats, 'data' => $page]);
    }

    public function update(Request $request, BasairApplication $application): JsonResponse
    {
        $this->guard($request);

        $data = $request->validate([
            'status'     => ['sometimes', Rule::in(['pending', 'accepted', 'rejected'])],
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $application->update($data);

        return response()->json(['message' => 'تم الحفظ.', 'data' => $application]);
    }

    public function destroy(Request $request, BasairApplication $application): JsonResponse
    {
        $this->guard($request);
        $application->delete();

        return response()->json(['message' => 'تم حذف الطلب.']);
    }

    public function export(Request $request): StreamedResponse
    {
        $this->guard($request);

        $rows = BasairApplication::orderBy('id')->get();
        $name = 'basair-' . date('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");   // BOM ليقرأ Excel العربية

            fputcsv($out, [
                '#', 'الاسم رباعي', 'رقم الهوية', 'الجنس', 'تاريخ الميلاد', 'العمر',
                'الحالة الاجتماعية', 'رقم الجوال', 'الواتساب', 'البريد الإلكتروني',
                'السكن الأصلي', 'السكن الأصلي بالتفصيل',
                'السكن الحالي', 'السكن الحالي بالتفصيل',
                'المؤهل العلمي', 'الحالة', 'ملاحظة إدارية', 'تاريخ التقديم',
            ]);

            $labels = ['pending' => 'قيد المراجعة', 'accepted' => 'مقبول', 'rejected' => 'مرفوض'];

            foreach ($rows as $i => $r) {
                fputcsv($out, [
                    $i + 1,
                    $r->full_name,
                    "\t" . $r->national_id,
                    $r->gender_label,
                    optional($r->birth_date)->format('Y-m-d'),
                    optional($r->birth_date)->age,
                    $r->marital_label,
                    "\t" . $r->phone,
                    "\t" . $r->whatsapp,
                    $r->email,
                    $r->origin_governorate,
                    $r->origin_address,
                    $r->current_governorate,
                    $r->current_address,
                    $r->qualification,
                    $labels[$r->status] ?? $r->status,
                    $r->admin_note,
                    $r->created_at->format('Y-m-d H:i'),
                ]);
            }
            fclose($out);
        }, $name, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}

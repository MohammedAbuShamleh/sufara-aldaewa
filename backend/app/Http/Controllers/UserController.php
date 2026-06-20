<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        if ($request->user()?->role !== 'admin') {
            abort(403, 'Unauthorized');
        }
    }

    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $query = User::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('id_number', 'like', "%{$s}%")
                    ->orWhere('region', 'like', "%{$s}%")
                    ->orWhere('governorate', 'like', "%{$s}%");
            });
        }

        $users = $query->orderBy('name')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'id_number' => $user->id_number,
                'region' => $user->region,
                'governorate' => $user->governorate,
                'role' => $user->role,
            ];
        });

        return response()->json($users);
    }

    public function show(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        $forms = $user->forms()->with('activities')->orderByDesc('year')->orderByDesc('month')->get();

        $months = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                   'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        $formSummaries = $forms->map(function ($form) use ($months) {
            $activities = $form->activities;
            return [
                'form_id'     => $form->id,
                'month'       => $form->month,
                'year'        => $form->year,
                'month_name'  => ($months[$form->month] ?? '') . ' ' . $form->year,
                'summary'     => [
                    'preaching_lessons'  => $activities->where('activity_type', 'preaching_lesson')->count(),
                    'scientific_lessons' => $activities->where('activity_type', 'scientific_lesson')->count(),
                    'sermons'            => $activities->where('activity_type', 'sermon')->count(),
                    'project_musalla_sermons' => $activities->where('activity_type', 'sermon')->where('is_project_musalla', true)->count(),
                    'tours'              => $activities->where('activity_type', 'tour')->count(),
                    'forums'             => $activities->where('activity_type', 'forum')->count(),
                    'media'              => $activities->where('activity_type', 'media')->count(),
                    'visits'             => $activities->where('activity_type', 'visit')->count(),
                    'reform'             => $activities->where('activity_type', 'reform')->count(),
                    'other'              => $activities->where('activity_type', 'other')->count(),
                ],
            ];
        });

        return response()->json([
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'id_number'   => $user->id_number,
            'region'      => $user->region,
            'governorate' => $user->governorate,
            'role'        => $user->role,
            'notes'       => $user->notes,
            'forms'       => $formSummaries,
        ]);
    }

    public function updateNotes(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'notes' => 'nullable|string|max:5000',
        ]);

        $user->update(['notes' => $validated['notes'] ?? null]);

        return response()->json(['message' => 'تم حفظ الملاحظات بنجاح', 'notes' => $user->notes]);
    }

    public function destroy(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'لا يمكنك حذف حسابك الخاص'], 422);
        }

        $user->delete();
        return response()->json(['message' => 'تم حذف المستخدم بنجاح']);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'id_number' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'governorate' => 'nullable|string|max:255',
        ]);

        if (empty($validated['email']) && empty($validated['id_number'])) {
            return response()->json(['message' => 'يجب إدخال البريد الإلكتروني أو رقم الهوية على الأقل'], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'password' => Hash::make($validated['password']),
            'id_number' => $validated['id_number'] ?? null,
            'region' => $validated['region'] ?? null,
            'governorate' => $validated['governorate'] ?? null,
            'role' => 'preacher',
        ]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'id_number' => $user->id_number,
            'region' => $user->region,
            'governorate' => $user->governorate,
            'role' => $user->role,
        ], 201);
    }

    public function downloadTemplate(Request $request): StreamedResponse
    {
        $this->ensureAdmin($request);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('المستخدمون');

        $headers = ['الاسم', 'البريد', 'كلمة المرور', 'رقم الهوية', 'المنطقة', 'المحافظة'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValueByColumnAndRow($col + 1, 1, $header);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'نموذج_استيراد_المستخدمين_' . date('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importExcel(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        try {
            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'تعذر قراءة الملف',
                'error' => $e->getMessage(),
            ], 422);
        }

        $created = 0;
        $errors = [];
        $header = array_map('trim', $rows[0] ?? []);
        $nameCol = $this->findColumnIndex($header, ['الاسم', 'name', 'اسم']);
        $emailCol = $this->findColumnIndex($header, ['البريد', 'email', 'بريد']);
        $passwordCol = $this->findColumnIndex($header, ['كلمة المرور', 'password']);
        $idNumberCol = $this->findColumnIndex($header, ['رقم الهوية', 'id_number', 'id number']);
        $regionCol = $this->findColumnIndex($header, ['المنطقة', 'region']);
        $governorateCol = $this->findColumnIndex($header, ['المحافظة', 'governorate']);

        if ($nameCol === null || $passwordCol === null) {
            return response()->json([
                'message' => 'المطلوب أعمدة: الاسم، كلمة المرور. واختياري: البريد، رقم الهوية، المنطقة، المحافظة',
            ], 422);
        }

        $defaultPassword = 'password123';

        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            $name = trim((string) ($row[$nameCol] ?? ''));
            $email = $emailCol !== null ? trim((string) ($row[$emailCol] ?? '')) : '';
            $password = trim((string) ($row[$passwordCol] ?? ''));
            $idNumber = $idNumberCol !== null ? trim((string) ($row[$idNumberCol] ?? '')) : null;
            $region = $regionCol !== null ? trim((string) ($row[$regionCol] ?? '')) : null;
            $governorate = $governorateCol !== null ? trim((string) ($row[$governorateCol] ?? '')) : null;

            if ($name === '' && $email === '' && empty($idNumber)) {
                continue;
            }

            $emailValue = $email !== '' ? $email : null;
            if ($emailValue !== null && User::where('email', $emailValue)->exists()) {
                $errors[] = "الصف " . ($i + 1) . ": البريد موجود مسبقاً ({$emailValue})";
                continue;
            }
            if ($idNumber && User::where('id_number', $idNumber)->exists()) {
                $errors[] = "الصف " . ($i + 1) . ": رقم الهوية موجود مسبقاً ({$idNumber})";
                continue;
            }
            if ($name === '' && !$idNumber) {
                $errors[] = "الصف " . ($i + 1) . ": يلزم الاسم أو رقم الهوية";
                continue;
            }

            if ($password === '') {
                $password = $defaultPassword;
            }

            try {
                User::create([
                    'name' => $name ?: 'داعية',
                    'email' => $emailValue,
                    'password' => Hash::make($password),
                    'id_number' => $idNumber ?: null,
                    'region' => $region ?: null,
                    'governorate' => $governorate ?: null,
                    'role' => 'preacher',
                ]);
                $created++;
            } catch (\Throwable $e) {
                $errors[] = "الصف " . ($i + 1) . ": " . $e->getMessage();
            }
        }

        return response()->json([
            'created' => $created,
            'errors' => $errors,
        ]);
    }

    private function findColumnIndex(array $header, array $names): ?int
    {
        foreach ($names as $name) {
            $idx = array_search($name, $header, true);
            if ($idx !== false) {
                return $idx;
            }
        }
        foreach ($header as $idx => $val) {
            if (in_array(mb_strtolower(trim((string) $val)), array_map('mb_strtolower', $names), true)) {
                return $idx;
            }
        }
        return null;
    }
}

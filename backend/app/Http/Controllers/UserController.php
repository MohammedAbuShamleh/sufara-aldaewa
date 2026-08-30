<?php

namespace App\Http\Controllers;

use App\Models\ContractResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
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

    /** يجمع معرّفات الصفات من ?tag_id= أو ?tag_ids[]= إلى مصفوفة أعداد صحيحة. */
    private function requestedTagIds(Request $request): array
    {
        $ids = array_merge(
            (array) $request->input('tag_ids', []),
            $request->filled('tag_id') ? [$request->input('tag_id')] : [],
        );

        return collect($ids)
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $contractVersion = (string) config('contract.version');

        $query = User::query()
            ->with('tags')
            // نحمّل ردود النسخة الحالية فقط — يكفي لعمود «العقد» دون جلب السجل كاملاً.
            ->with(['contractResponses' => fn ($q) => $q->where('contract_version', $contractVersion)]);

        // فلترة حسب الصفة (tag) — أي مستخدم يحمل أياً من الصفات المطلوبة (ANY)
        $tagIds = $this->requestedTagIds($request);
        if (! empty($tagIds)) {
            $query->whereHas('tags', fn ($q) => $q->whereIn('tags.id', $tagIds));
        }

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

        if ($request->filled('program_type')) {
            $query->where('program_type', $request->program_type);
        }

        // فلترة حسب حالة الحساب: active | disabled
        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->input('status') === 'disabled') {
            $query->where('is_active', false);
        }

        // فلترة حسب القرار تجاه العقد: agreed | declined | pending (لم يردّ بعد)
        $contractFilter = $request->input('contract_status');
        if (in_array($contractFilter, [ContractResponse::DECISION_AGREED, ContractResponse::DECISION_DECLINED], true)) {
            $query->whereHas('contractResponses', fn ($q) => $q
                ->where('contract_version', $contractVersion)
                ->where('decision', $contractFilter));
        } elseif ($contractFilter === User::CONTRACT_PENDING) {
            $query->whereDoesntHave('contractResponses', fn ($q) => $q->where('contract_version', $contractVersion));
        }

        $users = $query->orderBy('name')->get()->map(function ($user) use ($contractVersion) {
            $response = $user->currentContractResponse($contractVersion);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'id_number' => $user->id_number,
                'region' => $user->region,
                'governorate' => $user->governorate,
                'program_type' => $user->program_type,
                'administrative_title' => $user->administrative_title,
                'role' => $user->role,
                'is_active' => $user->isActive(),
                'disabled_at' => $user->disabled_at?->toIso8601String(),
                'tags' => $user->tagsArray(),
                'contract_decision' => $response?->decision ?? User::CONTRACT_PENDING,
                'contract_responded_at' => $response?->responded_at?->toIso8601String(),
            ];
        });

        return response()->json($users);
    }

    public function show(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        $user->load('tags');

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
            'program_type' => $user->program_type,
            'administrative_title' => $user->administrative_title,
            'role'        => $user->role,
            'is_active'   => $user->isActive(),
            'disabled_at' => $user->disabled_at?->toIso8601String(),
            'notes'       => $user->notes,
            'tags'        => $user->tagsArray(),
            'forms'       => $formSummaries,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'id_number' => 'nullable|string|max:255|unique:users,id_number,' . $user->id,
            'region' => 'nullable|string|max:255',
            'governorate' => 'nullable|string|max:255',
            'program_type' => 'nullable|in:scientific,dawah',
            'administrative_title' => 'nullable|string|max:255',
            'role' => ['nullable', Rule::in(User::ASSIGNABLE_ROLES)],
            'password' => 'nullable|string|min:6',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:tags,id',
        ]);

        if (empty($validated['email']) && empty($validated['id_number'])) {
            return response()->json(['message' => 'يجب إدخال البريد الإلكتروني أو رقم الهوية على الأقل'], 422);
        }

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'id_number' => $validated['id_number'] ?? null,
            'region' => $validated['region'] ?? null,
            'governorate' => $validated['governorate'] ?? null,
            'program_type' => $validated['program_type'] ?? null,
        ];

        // نحدّث المسمى الإداري فقط إذا أُرسل الحقل (حتى لا تمحوه الشاشات التي لا ترسله)
        if ($request->has('administrative_title')) {
            $data['administrative_title'] = $validated['administrative_title'] ?? null;
        }

        // الدور اختياري؛ لا نغيّره إذا لم يُرسل
        if (! empty($validated['role'])) {
            $data['role'] = $validated['role'];
        }

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        // مزامنة الصفات فقط إذا أُرسل الحقل (حتى لا تمحوها الشاشات التي لا ترسله)
        if ($request->has('tag_ids')) {
            $user->tags()->sync($validated['tag_ids'] ?? []);
        }

        $user->load('tags');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'id_number' => $user->id_number,
            'region' => $user->region,
            'governorate' => $user->governorate,
            'program_type' => $user->program_type,
            'administrative_title' => $user->administrative_title,
            'role' => $user->role,
            'is_active' => $user->isActive(),
            'disabled_at' => $user->disabled_at?->toIso8601String(),
            'tags' => $user->tagsArray(),
            'message' => 'تم تحديث بيانات الداعية بنجاح',
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

    /**
     * تعطيل الحساب أو إعادة تفعيله — البديل عن الحذف.
     *
     * التعطيل يمنع الدخول ويُبطل التوكنات القائمة (وإلا بقيت جلسة المستخدم
     * المفتوحة تعمل)، بينما تبقى بياناته ونماذجه وأنشطته في التقارير كما هي.
     */
    public function updateStatus(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $isActive = (bool) $validated['is_active'];

        if (! $isActive && $user->id === $request->user()->id) {
            return response()->json(['message' => 'لا يمكنك تعطيل حسابك الخاص'], 422);
        }

        $user->update([
            'is_active' => $isActive,
            'disabled_at' => $isActive ? null : now(),
        ]);

        // إنهاء جلسات الحساب المعطّل فوراً
        if (! $isActive) {
            $user->tokens()->delete();
        }

        return response()->json([
            'id' => $user->id,
            'is_active' => $user->isActive(),
            'disabled_at' => $user->disabled_at?->toIso8601String(),
            'message' => $isActive ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح',
        ]);
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
            'program_type' => 'nullable|in:scientific,dawah',
            'administrative_title' => 'nullable|string|max:255',
            'role' => ['nullable', Rule::in(User::ASSIGNABLE_ROLES)],
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:tags,id',
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
            'program_type' => $validated['program_type'] ?? null,
            'administrative_title' => $validated['administrative_title'] ?? null,
            'role' => $validated['role'] ?? User::ROLE_PREACHER,
        ]);

        if (! empty($validated['tag_ids'])) {
            $user->tags()->sync($validated['tag_ids']);
        }

        $user->load('tags');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'id_number' => $user->id_number,
            'region' => $user->region,
            'governorate' => $user->governorate,
            'program_type' => $user->program_type,
            'administrative_title' => $user->administrative_title,
            'role' => $user->role,
            'is_active' => $user->isActive(),
            'disabled_at' => $user->disabled_at?->toIso8601String(),
            'tags' => $user->tagsArray(),
        ], 201);
    }

    public function downloadTemplate(Request $request): StreamedResponse
    {
        $this->ensureAdmin($request);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('المستخدمون');

        $headers = ['الاسم', 'البريد', 'كلمة المرور', 'رقم الهوية', 'المنطقة', 'المحافظة', 'البرنامج', 'المسمى الإداري'];
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
        $programCol = $this->findColumnIndex($header, ['البرنامج', 'نوع البرنامج', 'program', 'program_type']);
        $adminTitleCol = $this->findColumnIndex($header, ['المسمى الإداري', 'المسمى', 'administrative_title', 'title']);

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
            $programType = $programCol !== null ? $this->normalizeProgramType((string) ($row[$programCol] ?? '')) : null;
            $adminTitle = $adminTitleCol !== null ? trim((string) ($row[$adminTitleCol] ?? '')) : null;

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
                    'program_type' => $programType,
                    'administrative_title' => $adminTitle ?: null,
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

    private function normalizeProgramType(string $value): ?string
    {
        $v = trim($value);
        if ($v === '') {
            return null;
        }
        if (mb_strpos($v, 'علم') !== false || mb_strtolower($v) === 'scientific') {
            return 'scientific';
        }
        if (mb_strpos($v, 'دعو') !== false || mb_strtolower($v) === 'dawah') {
            return 'dawah';
        }
        return null;
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

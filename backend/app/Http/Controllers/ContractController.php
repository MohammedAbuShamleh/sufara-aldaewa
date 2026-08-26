<?php

namespace App\Http\Controllers;

use App\Models\ContractResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * عقد الكفالة الإلكتروني — عرض نص العقد، وتوثيق الموافقة أو الرفض، وكشف الإدارة.
 *
 * نص العقد يأتي من config/contract.php وحده، فما يعرضه المتصفح هو ذاته النص
 * المرتبط بالنسخة (version) المسجّلة في الردّ.
 */
class ContractController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        if (! $request->user()?->canManageUsers()) {
            abort(403, 'Unauthorized');
        }
    }

    /** النسخة الحالية من العقد كما في الإعدادات. */
    private function version(): string
    {
        return (string) config('contract.version');
    }

    /**
     * GET /api/contract
     * نص العقد الحالي + قرار المستخدم تجاهه.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $version = $this->version();
        $response = $user->loadMissing('contractResponses')->currentContractResponse($version);

        return response()->json([
            'version'         => $version,
            'title'           => config('contract.title'),
            'subtitle'        => config('contract.subtitle'),
            'period'          => config('contract.period'),
            'clauses'         => config('contract.clauses'),
            'acknowledgement' => config('contract.acknowledgement'),
            'decline_notice'  => config('contract.decline_notice'),
            'decision'        => $response?->decision ?? User::CONTRACT_PENDING,
            'agreed'          => $response?->isAgreed() ?? false,
            'responded_at'    => $response?->responded_at?->toIso8601String(),
            'signatory'       => [
                'name'      => $user->name,
                'id_number' => $user->id_number,
            ],
        ]);
    }

    /**
     * POST /api/contract/agree
     * توثيق الموافقة على النسخة الحالية. تسجيل الموافقة idempotent: إعادة الاستدعاء
     * لا تُنشئ ردّاً ثانياً ولا تغيّر لحظة الموافقة الأصلية. ومن سبق أن رفض يُسمح له
     * بالعدول إلى الموافقة، فتُحدَّث لحظة الرد لأن هذا قرار جديد.
     */
    public function agree(Request $request)
    {
        return $this->recordDecision($request, ContractResponse::DECISION_AGREED, 'تم توثيق موافقتك على العقد.');
    }

    /**
     * POST /api/contract/decline
     * توثيق عدم الموافقة. لا يفتح النظام للمستخدم، ويبقى بإمكانه العدول والموافقة لاحقاً.
     */
    public function decline(Request $request)
    {
        return $this->recordDecision($request, ContractResponse::DECISION_DECLINED, 'تم تسجيل عدم موافقتك على العقد.');
    }

    /** يسجّل قرار المستخدم (موافقة/رفض) على النسخة الحالية ويعيد حالته بعدها. */
    private function recordDecision(Request $request, string $decision, string $message)
    {
        $user = $request->user();
        $version = $this->version();

        $response = ContractResponse::firstOrNew([
            'user_id' => $user->id,
            'contract_version' => $version,
        ]);

        // لا نلمس ردّاً سابقاً بنفس القرار حتى تبقى لحظة الرد الأصلية موثّقة كما هي.
        if (! $response->exists || $response->decision !== $decision) {
            $response->decision = $decision;
            $response->responded_at = Carbon::now();
            $response->ip_address = $request->ip();
            // نقتطع الـ user agent حتى لا يتضخّم السجل بترويسات طويلة شاذة.
            $response->user_agent = mb_substr((string) $request->userAgent(), 0, 1000) ?: null;
            $response->save();
        }

        return response()->json([
            'message'      => $message,
            'version'      => $version,
            'decision'     => $response->decision,
            'agreed'       => $response->isAgreed(),
            'responded_at' => $response->responded_at->toIso8601String(),
        ]);
    }

    /**
     * GET /api/contract/status
     * كشف الإدارة: قرار كل مستخدم تجاه النسخة الحالية (موافق / غير موافق / لم يردّ).
     */
    public function status(Request $request)
    {
        $this->ensureAdmin($request);

        $version = $this->version();
        $rows = $this->statusRows($version, $request->input('decision'));

        return response()->json([
            'version'  => $version,
            'total'    => $rows->count(),
            'agreed'   => $rows->where('decision', ContractResponse::DECISION_AGREED)->count(),
            'declined' => $rows->where('decision', ContractResponse::DECISION_DECLINED)->count(),
            'pending'  => $rows->where('decision', User::CONTRACT_PENDING)->count(),
            'users'    => $rows->values(),
        ]);
    }

    /**
     * صفوف الكشف مرتبة بالاسم، مع فلترة اختيارية بالقرار.
     * الفلترة تتم بعد الحساب لأن حالة «لم يردّ» غياب صفّ لا قيمة عمود.
     */
    private function statusRows(string $version, ?string $decisionFilter = null)
    {
        $users = User::query()
            ->with(['contractResponses' => fn ($q) => $q->where('contract_version', $version)])
            ->orderBy('name')
            ->get();

        $rows = $users->map(function (User $user) use ($version) {
            $response = $user->currentContractResponse($version);

            return [
                'id'           => $user->id,
                'name'         => $user->name,
                'id_number'    => $user->id_number,
                'email'        => $user->email,
                'region'       => $user->region,
                'governorate'  => $user->governorate,
                'role'         => $user->role,
                'decision'     => $response?->decision ?? User::CONTRACT_PENDING,
                'responded_at' => $response?->responded_at?->toIso8601String(),
                'ip_address'   => $response?->ip_address,
            ];
        });

        $allowed = array_merge(ContractResponse::DECISIONS, [User::CONTRACT_PENDING]);
        if (in_array($decisionFilter, $allowed, true)) {
            $rows = $rows->where('decision', $decisionFilter);
        }

        return $rows;
    }

    /**
     * GET /api/contract/status/export
     * تنزيل الكشف كملف Excel (يحترم فلتر القرار إن مُرِّر).
     */
    public function exportStatus(Request $request): StreamedResponse
    {
        $this->ensureAdmin($request);

        $version = $this->version();
        $rows = $this->statusRows($version, $request->input('decision'));

        $labels = [
            ContractResponse::DECISION_AGREED   => 'موافق',
            ContractResponse::DECISION_DECLINED => 'غير موافق',
            User::CONTRACT_PENDING              => 'لم يردّ بعد',
        ];

        $roleLabels = [
            User::ROLE_ADMIN                => 'أدمن',
            User::ROLE_ADMIN_SECRETARY      => 'السكرتير / الإداري',
            User::ROLE_CENTRAL_MANAGER      => 'مسؤول مركزي',
            User::ROLE_GOVERNORATE_MANAGER  => 'مسؤول المحافظة',
            User::ROLE_TEAM_LEADER          => 'مسؤول فريق',
            User::ROLE_PREACHER             => 'داعية',
        ];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('كشف العقد');
        $sheet->setRightToLeft(true);

        $headers = ['#', 'الاسم', 'رقم الهوية', 'البريد', 'المنطقة', 'المحافظة', 'الدور', 'حالة العقد', 'تاريخ الرد'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValueByColumnAndRow($col + 1, 1, $header);
        }

        $headerRange = 'A1:' . $sheet->getCellByColumnAndRow(count($headers), 1)->getColumn() . '1';
        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('0D9488');
        $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $rowNumber = 2;
        foreach ($rows->values() as $index => $row) {
            $respondedAt = $row['responded_at']
                ? Carbon::parse($row['responded_at'])->format('Y-m-d H:i')
                : '—';

            $values = [
                $index + 1,
                $row['name'],
                $row['id_number'] ?: '—',
                $row['email'] ?: '—',
                $row['region'] ?: '—',
                $row['governorate'] ?: '—',
                $roleLabels[$row['role']] ?? $row['role'],
                $labels[$row['decision']] ?? $row['decision'],
                $respondedAt,
            ];

            foreach ($values as $col => $value) {
                $sheet->setCellValueByColumnAndRow($col + 1, $rowNumber, $value);
            }
            $rowNumber++;
        }

        foreach (range(1, count($headers)) as $col) {
            $sheet->getColumnDimensionByColumn($col)->setAutoSize(true);
        }
        $sheet->freezePane('A2');

        $writer = new Xlsx($spreadsheet);
        $filename = 'كشف_عقد_الكفالة_' . date('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * DELETE /api/contract/decliners
     * حذف حسابات من سجّلوا عدم موافقتهم على النسخة الحالية.
     *
     * عملية غير قابلة للتراجع، لذا تشترط تأكيداً صريحاً (confirm=true) من الواجهة،
     * وتستثني دائماً حساب المنفّذ نفسه وأي حساب أدمن آخر حتى لا تُفقد إدارة النظام.
     */
    public function destroyDecliners(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'confirm' => 'accepted',
        ], [
            'confirm.accepted' => 'حذف الحسابات يتطلب تأكيداً صريحاً.',
        ]);

        $version = $this->version();
        $admin = $request->user();

        $decliners = User::query()
            ->whereHas('contractResponses', fn ($q) => $q
                ->where('contract_version', $version)
                ->where('decision', ContractResponse::DECISION_DECLINED))
            ->where('id', '!=', $admin->id)
            ->where('role', '!=', User::ROLE_ADMIN)
            ->get();

        $deleted = [];
        foreach ($decliners as $user) {
            $deleted[] = ['id' => $user->id, 'name' => $user->name, 'id_number' => $user->id_number];
            $user->delete();
        }

        return response()->json([
            'message' => count($deleted) > 0
                ? 'تم حذف ' . count($deleted) . ' حساباً من غير الموافقين.'
                : 'لا يوجد حسابات مؤهلة للحذف.',
            'deleted_count' => count($deleted),
            'deleted' => $deleted,
        ]);
    }
}

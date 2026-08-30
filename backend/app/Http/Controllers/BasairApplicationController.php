<?php

namespace App\Http\Controllers;

use App\Models\BasairApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BasairApplicationController extends Controller
{
    private const GOVERNORATES = ['الشمال', 'غزة', 'الوسطى', 'خان يونس', 'رفح'];

    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'full_name' => preg_replace('/\s+/u', ' ', trim((string) $request->full_name)),
            'phone'     => preg_replace('/[\s\-]/', '', (string) $request->phone),
            'whatsapp'  => preg_replace('/[\s\-]/', '', (string) $request->whatsapp),
            'email'     => mb_strtolower(trim((string) $request->email)),
        ]);

        $data = $request->validate([
            'full_name'      => ['required', 'string', 'max:150', 'regex:/^\S+(\s+\S+){3,}$/u'],
            'gender'         => ['required', Rule::in(['male', 'female'])],
            'national_id'    => ['required', 'digits:9', 'unique:basair_applications,national_id'],
            'birth_date'     => ['required', 'date', 'before:today', 'after:1930-01-01'],
            'marital_status' => ['required', Rule::in(['single', 'married', 'widowed'])],

            'phone'    => ['required', 'regex:/^0\d{9}$/'],
            'whatsapp' => ['required', 'regex:/^\+?\d{8,15}$/'],
            'email'    => ['required', 'email:rfc', 'max:150'],

            'origin_governorate'  => ['required', Rule::in(self::GOVERNORATES)],
            'origin_address'      => ['required', 'string', 'min:5', 'max:255'],
            'current_governorate' => ['required', Rule::in(self::GOVERNORATES)],
            'current_address'     => ['required', 'string', 'min:5', 'max:255'],
            'qualification'       => ['required', 'string', 'min:2', 'max:150'],
        ], [
            'required'                      => 'هذا الحقل مطلوب.',
            'full_name.required'            => 'اكتب الاسم رباعيًا كما في الهوية.',
            'gender.required'               => 'اختر الجنس.',
            'marital_status.required'       => 'اختر الحالة الاجتماعية.',
            'origin_governorate.required'   => 'اختر المحافظة.',
            'current_governorate.required'  => 'اختر المحافظة.',
            'gender.in'                     => 'اختر الجنس.',
            'marital_status.in'             => 'اختر الحالة الاجتماعية.',
            'origin_governorate.in'         => 'اختر محافظة من القائمة.',
            'current_governorate.in'        => 'اختر محافظة من القائمة.',
            'full_name.regex'               => 'اكتب الاسم رباعيًا كما في الهوية.',
            'national_id.digits'            => 'رقم الهوية تسعة أرقام بدون فواصل.',
            'national_id.unique'            => 'يوجد طلب مسجّل بهذا الرقم مسبقًا.',
            'birth_date.before'             => 'تاريخ الميلاد لازم يكون قبل اليوم.',
            'phone.regex'                   => 'رقم الجوال عشرة أرقام يبدأ بصفر، مثل 0591234567.',
            'whatsapp.regex'                => 'أضف مقدمة الدولة مع الرقم، مثل +970591234567.',
            'email.email'                   => 'أدخل بريدًا إلكترونيًا صحيحًا.',
            'origin_address.min'            => 'اذكر الحي والمسجد أو أقرب مَعلم.',
            'current_address.min'           => 'اذكر الحي والمسجد أو أقرب مَعلم.',
        ], [
            'full_name'           => 'الاسم رباعي',
            'gender'              => 'الجنس',
            'national_id'         => 'رقم الهوية',
            'birth_date'          => 'تاريخ الميلاد',
            'marital_status'      => 'الحالة الاجتماعية',
            'phone'               => 'رقم الجوال',
            'whatsapp'            => 'رقم حساب الواتساب',
            'email'               => 'البريد الإلكتروني',
            'origin_governorate'  => 'مكان السكن الأصلي',
            'origin_address'      => 'مكان السكن الأصلي بالتفصيل',
            'current_governorate' => 'مكان السكن الحالي',
            'current_address'     => 'مكان السكن الحالي بالتفصيل',
            'qualification'       => 'المؤهل العلمي',
        ]);

        $application = BasairApplication::create(
            $data + ['ip_address' => $request->ip()]
        );

        return response()->json([
            'message' => 'تم استلام طلب الالتحاق بنجاح.',
            'id'      => $application->id,
        ], 201);
    }
}

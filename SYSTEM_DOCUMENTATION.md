# توثيق نظام «سفراء الدعوة» — نظام متابعة الأنشطة الدعوية

> وثيقة مرجعية شاملة تشرح النظام من الألف إلى الياء: البنية، نموذج البيانات، الأدوار والصلاحيات، نظام التقارير ونطاق الرؤية، تدفّقات العمل، واجهة الـ API، والتشغيل والنشر.

آخر تحديث: 2026-08-02

---

## 1. نظرة عامة

نظام لتوثيق ومتابعة الأنشطة الدعوية الميدانية (دروس، خطب، جولات، ملتقيات، زيارات… إلخ). يعبّئ **الداعية** نموذجاً شهرياً بأنشطته، ويتابع **المشرفون** (مسؤول فريق / محافظة / مركزي) التقارير كلٌّ ضمن نطاق صلاحيته، مع تصدير إلى Excel.

النظام مكوّن من جزأين منفصلين:

| الجزء | التقنية | المجلد |
|------|---------|--------|
| الخادم (Backend) | Laravel 11 + Sanctum + REST API | `backend/` |
| الواجهة (Frontend) | React 18 + TypeScript + Vite + Tailwind | `frontend/` |

المصادقة عبر **Laravel Sanctum** (توكن Bearer يُخزَّن في `localStorage`)، والتواصل عبر REST API على المسار `/api`.

---

## 2. البنية التقنية

### الخادم — `backend/`
- **Laravel 11**, PHP ^8.2
- **laravel/sanctum ^4** — توكنات API
- **maatwebsite/excel ^3.1** — تصدير Excel
- قاعدة البيانات: **SQLite** للتطوير المحلي، **MySQL** للإنتاج (يُضبط عبر `DB_CONNECTION` في `.env`)

بنية المجلدات المهمة:
```
backend/
├── app/
│   ├── Models/           User, Form, Activity, Tag
│   ├── Http/Controllers/ Auth, User, Form, Activity, Dashboard, Export, Tag
│   ├── Services/         PreacherReportService  (مصدر ملخّص التقارير الوحيد)
│   └── Exports/          ActivitiesExport, AllFormsExport
├── database/
│   ├── migrations/       مخطّط الجداول
│   └── seeders/          DatabaseSeeder, TagSeeder
└── routes/api.php        كل مسارات الـ API
```

### الواجهة — `frontend/`
- **React 18 + React Router 6 + TypeScript 5**
- **Vite 5** (بناء وتطوير)، **Tailwind CSS 3** (التنسيق)
- **axios** (طلبات الـ API)، **react-hook-form**

بنية المجلدات المهمة:
```
frontend/src/
├── components/
│   ├── Auth/Login.tsx
│   ├── Dashboard/    Dashboard, PreacherProfile, UsersSection, ActivitiesTable, TagsSelect
│   ├── Form/         MultiStepForm + خطوات النموذج
│   └── Layout/       Header, FormHeader, Sidebar
├── services/         api.ts (axios), auth.tsx (سياق المصادقة)
└── constants/        roles.ts, programs.ts, tags.ts
```

---

## 3. نموذج البيانات

### جدول `users` — المستخدمون (الدعاة والمشرفون)
| العمود | النوع | ملاحظات |
|--------|------|---------|
| `id` | bigint | — |
| `name` | string | الاسم |
| `email` | string nullable unique | البريد (اختياري) |
| `password` | string | مُجزّأ (hashed) |
| `id_number` | string nullable unique | رقم الهوية — وسيلة الدخول الأساسية |
| `region` | string nullable | **الفريق / المنطقة الفرعية** (نطاق مسؤول الفريق) |
| `governorate` | string nullable | المحافظة (نطاق مسؤول المحافظة) |
| `program_type` | enum nullable | `scientific` (علمي) \| `dawah` (دعوي) |
| `administrative_title` | string nullable | **المسمى الإداري** — نص وصفي فقط، لا يمنح صلاحية |
| `role` | string | الدور (يحكم الصلاحيات — انظر §4) |
| `notes` | text nullable | ملاحظات الإدارة (خاصة، غير مرتبطة بالنماذج) |

### جدول `forms` — النماذج الشهرية (= التقارير)
| العمود | النوع | ملاحظات |
|--------|------|---------|
| `id` | bigint | — |
| `user_id` | FK → users nullable | صاحب النموذج (حذف متتالٍ) |
| `preacher_name` | string | اسم الداعية على النموذج |
| `sub_region` | string nullable | **المنطقة الفرعية** (حقل جغرافي على النموذج) |
| `month` | tinyint (1–12) | الشهر |
| `year` | smallint | السنة |

قيد فريد: `unique(user_id, month, year)` — **نموذج واحد لكل داعية في كل شهر**.

### جدول `activities` — الأنشطة (تفاصيل النموذج)
| العمود | النوع | ملاحظات |
|--------|------|---------|
| `id` | bigint | — |
| `form_id` | FK → forms | (حذف متتالٍ) |
| `activity_type` | enum | أحد ٩ أنواع (انظر أدناه) |
| `execution_date` | date nullable | تاريخ التنفيذ |
| `details` | text | تفاصيل النشاط |
| `target_audience` | string nullable | الجهة المستهدفة |
| `location` | string nullable | مكان التنفيذ |
| `is_project_musalla` | boolean | هل هي خطبة في مصلى مشروع؟ |
| `beneficiaries_count` | integer | عدد المستفيدين |
| `tour_responsible` | string nullable | مسؤول الجولة |
| `coordination_responsible` | string nullable | مسؤول التنسيق |

**أنواع الأنشطة الـ ٩:** `preaching_lesson` (دروس وعظية)، `scientific_lesson` (دروس علمية)، `sermon` (خطب)، `tour` (جولات)، `forum` (ملتقيات)، `media` (إعلامية)، `visit` (زيارات)، `reform` (إصلاح)، `other` (أخرى).

> في ملخّص التقرير تظهر **١٠ عدّادات**: نوع «الخطب» يُقسَّم إلى «خطب» و«خطب مصليات المشروع» (`is_project_musalla`).

### جدول `tags` + `tag_user` — الصفات التصنيفية
علاقة متعددة-لمتعددة بين المستخدمين والصفات. **للفرز والفلترة فقط، لا تمنح أي صلاحية** (الرؤية محكومة بالدور وحده).

### العلاقات
```
User (1) ──< (N) Form (1) ──< (N) Activity
User (N) >──< (N) Tag   (عبر tag_user)
```

---

## 4. الأدوار والصلاحيات

الأدوار الستة (ثابت `role` على `User`):

| الدور | القيمة | الوصف | نطاق رؤية التقارير |
|------|--------|-------|-------------------|
| أدمن | `admin` | أدمن النظام | كل التقارير + إدارة المستخدمين |
| السكرتير/الإداري | `admin_secretary` | مكتبي | كل التقارير |
| مسؤول مركزي | `central_manager` | مكتبي | كل التقارير |
| مسؤول المحافظة | `governorate_manager` | ميداني/إشرافي | محافظته فقط |
| مسؤول الفريق | `team_leader` | ميداني/إشرافي | محافظته + فريقه (`region`) |
| داعية | `preacher` | ميداني | نفسه فقط |

### مجموعات الأدوار (في `User.php` و `frontend/src/constants/roles.ts`)
- **`ALL_REPORTS_ROLES`** = [admin, admin_secretary, central_manager] — يرون كل التقارير في كل المحافظات (أدوار مكتبية مركزية).
- **`REPORT_VIEWER_ROLES`** = ALL_REPORTS_ROLES + [governorate_manager, team_leader] — يحق لهم فتح لوحة التقارير (كلٌّ بنطاقه).
- **`ASSIGNABLE_ROLES`** = الأدوار الستة كلها (قابلة للإسناد من واجهة إدارة المستخدمين).

### دوال الصلاحيات (على `User`)
- `canViewAllReports()` — يرى كل شيء؟
- `canViewReports()` — يحق له فتح لوحة التقارير أصلاً؟
- `canManageUsers()` — إدارة المستخدمين (**للأدمن فقط**).

### نطاقات الاستعلام (Query Scopes)
- **`User::scopeVisibleToViewer($q, $viewer)`** — يقيّد الدعاة إلى نطاق العارض:
  - أدوار «كل التقارير» → بدون تقييد.
  - مسؤول المحافظة → `where governorate = viewer.governorate`.
  - مسؤول الفريق → `where governorate = ... AND region = ...`.
  - غير ذلك → نفسه فقط (`where id = viewer.id`).
- **`Form::scopeVisibleTo($q, $viewer)`** و **`Form->isVisibleTo($viewer)`** — نفس المنطق لكن انطلاقاً من النموذج (يعتمد على بيانات صاحب النموذج كمصدر الحقيقة).

> **ملاحظة مهمة على حقلي الموقع — لا تخلط بينهما:**
> - `users.region` = **الفريق** (نطاق مسؤول الفريق + فلتر `?team=`).
> - `forms.sub_region` = **المنطقة الفرعية** (حقل جغرافي على النموذج + فلتر `?sub_region=`).

---

## 5. نظام التقارير ونطاق الرؤية (الجوهر)

### مصدر الملخّص الوحيد: `PreacherReportService::summary($viewer, $filters)`
`app/Services/PreacherReportService.php` هو **المصدر الوحيد** لملخّص التقارير الشهري (صف لكل داعية). يستخدمه:
1. `DashboardController::summary` — لوحة التقارير على الشاشة.
2. `AllFormsExport` — ورقة «الملخص الشهري» في ملف Excel.

بذلك لا تفترق الشاشة عن التصدير أبداً (نفس النطاق، نفس الفلاتر، نفس الأعمدة).

### قاعدة الظهور في التقارير — `User::scopeReportable($month, $year)`
يُبنى الملخّص انطلاقاً من «الدعاة المشمولين بالتقارير»، وتعريفهم:

```
role = 'preacher'   ⟶  يظهر دائماً (حتى لو لم يُسلّم — لرصد المتخلّفين)
        OR
عبّأ نموذجاً لهذا الشهر (بأي دور)  ⟶  يظهر
```

> **لماذا هذه القاعدة؟** سابقاً كان الملخّص يقتصر على `role = 'preacher'` فقط، فأي داعية رُقّي لدور إداري (مسؤول فريق/محافظة) كان **يختفي** من التقارير والتصدير رغم أنه ما زال يعبّئ نموذجه الميداني. القاعدة الحالية تُعيد إظهار كل من عبّأ نموذجاً بغضّ النظر عن دوره، مع الحفاظ على إظهار الدعاة غير المسلّمين.
>
> **المسمى الإداري (`administrative_title`) نصّ وصفي فقط؛ الذي يحكم الظهور والصلاحية هو `role`.**

### خطوات بناء الملخّص
1. جلب المستخدمين ضمن نطاق العارض (`visibleToViewer`) المطابقين لـ `reportable($month, $year)`، مع تطبيق الفلاتر الاختيارية.
2. جلب نماذج الشهر المطلوب (مقيّدة بنطاق العارض) وفهرستها بمعرّف الداعية.
3. لكل مستخدم: إنتاج صف يحوي بياناته + عدّادات الأنشطة الـ ١٠ + `has_form` (هل سلّم؟).

### فلاتر التقارير المدعومة
`month`, `year`, `governorate`, `sub_region` (المنطقة الفرعية على النموذج), `team` (الفريق = `users.region`), `program_type`, `preacher_name`, `tag_id`.

قوائم الفلاتر المقيّدة بالنطاق تأتي من:
- `GET /api/dashboard/governorates`
- `GET /api/dashboard/sub-regions?governorate=`

---

## 6. الصفات التصنيفية (Tags)

طبقة تصنيف متعددة للمستخدم (علاقة N:N). **لا تمنح صلاحية**، فقط للفرز والفلترة. الصفات الاثنتا عشرة المعتمدة تُزرع عبر `TagSeeder` (`Tag::SEED_NAMES`): عضو فريق، عضو فريق – جولات، مسؤول فريق، إداري، مسؤول ملف الخطب، مسؤول ملف دعوي، مسؤول ملف علمي، مسؤول الدائرة العلمية بالمحافظة، مسؤول الدائرة الدعوية المركزية، مسؤول الدائرة الدعوية بالمحافظة، مسؤول الدائرة العلمية المركزية، إعلامي.

- تُعرض وتُحرَّر في إدارة المستخدمين وملف الداعية.
- تُزامَن عند الإنشاء/التحديث فقط إذا أُرسل الحقل `tag_ids` (حتى لا تمحوها الشاشات التي لا ترسله).

---

## 7. تدفّقات العمل الرئيسية

### أ) تسجيل الدخول والتوجيه
1. الدخول عبر **رقم الهوية أو البريد** + كلمة المرور (`POST /api/login`).
2. يُعاد `user` + `token`؛ يُخزَّن التوكن في `localStorage`.
3. التوجيه حسب الدور (`Login.tsx`):
   - **أدمن / سكرتير / مركزي** (`canViewAllReports`) → `/dashboard` مباشرةً (مكتبيون، لا يعبّئون نماذج).
   - **بقية الأدوار الميدانية** (داعية، مسؤول فريق، مسؤول محافظة) → `/form` (**نموذجهم أولاً**).

### ب) التنقّل ثنائي الاتجاه (الطبيعة المزدوجة للمشرف الميداني)
- في صفحة النموذج (`FormHeader`): يظهر زر **«📊 لوحة التقارير»** لمن له صلاحية عرض التقارير (`canViewReports`) → ينتقل للوحة ليتابع فريقه/محافظته حسب نطاقه.
- في لوحة التقارير (`Header`): يظهر زر **«📝 النموذج»** → يعود لتعبئة نموذجه الشخصي.

### ج) تعبئة النموذج الشهري (`MultiStepForm`)
- `GET /api/forms/my-form` يجلب نموذج الشهر الحالي للمستخدم (يُنشئه فارغاً إن لم يوجد).
- يضيف/يعدّل/يحذف أنشطة عبر مسارات `/api/activities`.

### د) لوحة التقارير (`Dashboard`)
- تعرض جدول ملخّص (صف لكل داعية) عبر `GET /api/dashboard/summary` مع الفلاتر.
- تُبرز المتخلّفين عن التسليم (`has_form = false`).
- إدارة المستخدمين (`UsersSection`) تظهر **للأدمن فقط**.

### هـ) إدارة المستخدمين (أدمن فقط)
إنشاء/تعديل/حذف الدعاة، استيراد من Excel، تنزيل نموذج Excel، إسناد الأدوار والصفات والمسمى الإداري.
- عند **التعديل**: يُحدَّث `administrative_title` فقط إذا أُرسل الحقل؛ ويُحدَّث الدور فقط إذا أُرسل؛ وتُزامَن الصفات فقط إذا أُرسل `tag_ids` — حتى لا تمحوها الشاشات التي لا ترسلها.

### و) التصدير إلى Excel
- **مفرد**: `GET /api/export/excel/{form}` → `ActivitiesExport` (تفاصيل نموذج واحد).
- **شامل**: `GET /api/export/excel-all` → `AllFormsExport` بثلاث أوراق:
  1. **الملخص الشهري** — صف لكل داعية (يطابق الشاشة، يُبرز المتخلّفين بلون أصفر، أعمدة الحالة والإجمالي).
  2. **جميع الأنشطة التفصيلية** — صف لكل نشاط.
  3. **الملخص الإجمالي** — صف لكل نموذج.
- التصدير مقيَّد بنطاق العارض (نفس نطاق القائمة).

---

## 8. واجهة الـ API

كل المسارات تحت `/api`. ما عدا `/login` كلها محمية بـ `auth:sanctum`.

### المصادقة
| الطريقة | المسار | الوصف |
|--------|--------|-------|
| POST | `/login` | دخول (id_number أو email + password) |
| POST | `/logout` | خروج |
| GET | `/user` | بيانات المستخدم الحالي |
| PATCH | `/user/notes` | تحديث ملاحظات المستخدم لنفسه |

### إدارة المستخدمين (أدمن فقط)
| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/users` | قائمة المستخدمين (فلاتر: search, program_type, tag_ids) |
| GET | `/users/{user}` | تفاصيل مستخدم + ملخّص نماذجه |
| POST | `/users` | إنشاء مستخدم |
| PUT | `/users/{user}` | تعديل مستخدم |
| PATCH | `/users/{user}/notes` | تعديل ملاحظات الإدارة |
| DELETE | `/users/{user}` | حذف مستخدم |
| GET | `/users/download-template` | تنزيل نموذج Excel للاستيراد |
| POST | `/users/import-excel` | استيراد مستخدمين من Excel |

### النماذج والأنشطة
| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/forms/my-form` | نموذج الشهر الحالي للمستخدم (يُنشأ إن لم يوجد) |
| POST | `/forms` | إنشاء نموذج |
| GET | `/forms/{form}` | عرض نموذج (ضمن النطاق) |
| PUT | `/forms/{form}` | تعديل نموذج (المالك فقط) |
| GET | `/forms` | قائمة النماذج (للمشرفين، ضمن النطاق) |
| DELETE | `/forms/{form}` | حذف نموذج (المالك أو «كل التقارير») |
| GET/POST/PUT/DELETE | `/activities...` | إدارة الأنشطة (تحقق ملكية النموذج) |

### التقارير والتصدير والصفات
| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/dashboard/summary` | ملخّص التقارير الشهري (المصدر الوحيد) |
| GET | `/dashboard/governorates` | المحافظات ضمن نطاق العارض |
| GET | `/dashboard/sub-regions` | المناطق الفرعية ضمن النطاق |
| GET | `/export/excel/{form}` | تصدير نموذج مفرد |
| GET | `/export/excel-all` | تصدير شامل (٣ أوراق) |
| GET | `/tags` | قائمة الصفات |

---

## 9. الأمان والصلاحيات — نقاط الإنفاذ

الإنفاذ **من جهة الخادم** على كل المسارات الحسّاسة:
- إدارة المستخدمين: `UserController::ensureAdmin` (أدمن فقط).
- التقارير: `DashboardController::viewerOrAbort` (يتحقق `canViewReports`).
- النماذج: `FormController` يتحقق `canViewReports` للقائمة، و`isVisibleTo` للعرض/الحذف، والملكية للتعديل.
- التصدير: `ExportController` يتحقق `canViewReports` + `isVisibleTo`.
- الواجهة تعكس نفس المنطق (`constants/roles.ts`) للتوجيه وإظهار العناصر، لكن **الخادم هو مصدر الحقيقة**.

---

## 10. التشغيل المحلي

### الخادم
```bash
cd backend
composer install
cp .env.example .env   # اضبط DB_CONNECTION=sqlite
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

### الواجهة
```bash
cd frontend
npm install
npm run dev
```
> اضبط `VITE_API_URL` إن كان الـ API على منفذ/نطاق مختلف (الافتراضي `/api`).

---

## 11. النشر (Production)

راجع `DEPLOYMENT.md` و`DEPLOY_CHECKLIST.md` للتفاصيل. باختصار:
```bash
git pull
cd backend && composer install --no-dev -o
php artisan migrate --force
php artisan config:clear && php artisan route:clear   # أو route:cache وأعد التشغيل
cd ../frontend && npm ci && npm run build
```
- على الإنتاج: `DB_CONNECTION=mysql` في `.env`.
- مجلد `frontend/dist/` **مُستبعد من git** ويُبنى عند النشر عبر `npm run build` — تأكد من تنفيذ خطوة البناء.
- بعد أي تعديل على الخادم: **أعد نشر الباك-إند فعلياً** (نسخة قديمة منشورة قد تُظهر سلوكاً قديماً رغم صحّة الكود في المستودع).

---

## 12. الحسابات التجريبية (Seed)

كلمة المرور للجميع: **`password`** — الدخول برقم الهوية.

| رقم الهوية | الاسم | الدور | المحافظة | الفريق |
|-----------|------|------|---------|-------|
| admin@example.com | Admin | admin | — | — |
| 900000001 | مدير مركزي | central_manager | — | — |
| 900000002 | السكرتير الإداري | admin_secretary | — | — |
| 900000010 | مسؤول محافظة غزة | governorate_manager | غزة | — |
| 900000011 | مسؤول محافظة خان يونس | governorate_manager | خان يونس | — |
| 900000020 | مسؤول فريق شرق غزة | team_leader | غزة | شرق غزة - الدرج |
| 900000021 | مسؤول فريق دير البلح | team_leader | الوسطى | دير البلح |
| 100000001–6 | دعاة موزّعون | preacher | متنوّعة | متنوّعة |

---

## 13. سجل التغييرات الأخيرة (2026-08-02)

1. **إظهار تقارير الدعاة ذوي الأدوار الإدارية:** أُضيف `User::scopeReportable($month, $year)` وحلّ محلّ الفلتر الصارم `role = 'preacher'` في `PreacherReportService::summary` و`DashboardController::governorates`. الآن يظهر كل من عبّأ نموذجاً (بأي دور) + كل الدعاة العاديين (حتى غير المسلّمين). يشمل ذلك التصدير تلقائياً.

2. **تحصين حفظ تعديل المستخدم:** `UsersSection.handleEditSave` صار يحدّث الصف فوراً من رد الخادم بعد الحفظ (تفادياً لأي كاش على `GET /users`). *(مسار الحفظ في الكود كان سليماً أصلاً؛ ظهور «رجوع القيمة القديمة» على السيرفر سببه نسخة باك-إند قديمة منشورة — يُحلّ بإعادة النشر.)*

3. **زر تبديل الصفحة للمشرف الميداني:** أُضيف زر «📊 لوحة التقارير» في `FormHeader` لمن له صلاحية عرض التقارير.

4. **توجيه الدخول:** الأدوار الميدانية (بما فيها مسؤول الفريق/المحافظة) تهبط على **نموذجها أولاً**؛ الأدوار المركزية المكتبية على لوحة التقارير.

5. **إصلاح فلتر المنطقة الفرعية:** كان الفلتر يُظهر فقط من سلّم نموذجاً **بهذه المنطقة في نفس الشهر**، فيختفي بقية أعضاء المنطقة (المتخلّفون عن التسليم). صار الآن يُظهر **كل من ينتمي للمنطقة** (له نموذج بها في أي شهر)، مع الإبقاء على حساب حالة التسليم لهذا الشهر بشكل مستقل (`has_form`) — فيظهر كامل أعضاء المنطقة ويُبرز المتخلّفين. *(`PreacherReportService::summary`)*

---

### مراجع الملفات السريعة
- الأدوار والصلاحيات: `backend/app/Models/User.php` ، `frontend/src/constants/roles.ts`
- ملخّص التقارير: `backend/app/Services/PreacherReportService.php`
- المسارات: `backend/routes/api.php`
- التصدير: `backend/app/Exports/AllFormsExport.php`
- التوجيه والتنقّل: `frontend/src/App.tsx` ، `Login.tsx` ، `Layout/Header.tsx` ، `Layout/FormHeader.tsx`

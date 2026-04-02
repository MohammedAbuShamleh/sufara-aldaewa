# نظام متابعة الأنشطة الدعوية

نظام شامل لجمع ومتابعة البيانات الخاصة بالأنشطة الدعوية مع إمكانية تصدير البيانات إلى Excel.

## المميزات

- ✅ نظام مصادقة آمن باستخدام Laravel Sanctum
- ✅ نموذج متعدد الخطوات (9 خطوات) لجمع البيانات
- ✅ لوحة تحكم لعرض جميع الاستبيانات
- ✅ تصدير البيانات إلى Excel (تفصيلي + ملخص)
- ✅ فلترة البيانات حسب اسم الداعية والمنطقة
- ✅ تصميم إسلامي أنيق بالألوان المحددة

## التقنيات المستخدمة

### Backend
- Laravel 11
- Laravel Sanctum (المصادقة)
- Laravel Excel (Maatwebsite) (تصدير Excel)
- MySQL/PostgreSQL

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios
- React Hook Form

## التثبيت والإعداد

### متطلبات النظام
- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL/PostgreSQL
- npm أو yarn

### إعداد Backend (Laravel)

1. انتقل إلى مجلد backend:
```bash
cd backend
```

2. قم بتثبيت الحزم:
```bash
composer install
```

3. انسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```

4. قم بتوليد مفتاح التطبيق:
```bash
php artisan key:generate
```

5. قم بتعديل ملف `.env` وإضافة بيانات قاعدة البيانات:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=linkibnbaz
DB_USERNAME=root
DB_PASSWORD=
```

6. قم بتشغيل Migrations:
```bash
php artisan migrate
```

7. قم بإنشاء مستخدم تجريبي (اختياري):
```bash
php artisan tinker
```
ثم في Tinker:
```php
$user = new App\Models\User();
$user->name = 'Admin';
$user->email = 'admin@example.com';
$user->password = Hash::make('password');
$user->save();
```

8. قم بتشغيل الخادم:
```bash
php artisan serve
```

الخادم سيعمل على: `http://localhost:8000`

### إعداد Frontend (React)

1. انتقل إلى مجلد frontend:
```bash
cd frontend
```

2. قم بتثبيت الحزم:
```bash
npm install
```

3. قم بتشغيل خادم التطوير:
```bash
npm run dev
```

التطبيق سيعمل على: `http://localhost:5173`

## استخدام النظام

### تسجيل الدخول
1. افتح المتصفح وانتقل إلى `http://localhost:5173`
2. سجل الدخول باستخدام البريد الإلكتروني وكلمة المرور

### إنشاء استبيان جديد
1. من لوحة التحكم، اضغط على "نموذج جديد"
2. املأ البيانات في كل خطوة:
   - الخطوة 1: معلومات عامة (اسم الداعية، المنطقة)
   - الخطوة 2-9: بيانات الأنشطة المختلفة
3. اضغط "التالي" للانتقال للخطوة التالية
4. البيانات تُحفظ تلقائياً عند الانتقال بين الخطوات

### عرض البيانات
- من لوحة التحكم يمكنك:
  - عرض جميع الاستبيانات في جدول
  - فلترة البيانات حسب اسم الداعية أو المنطقة
  - تصدير البيانات إلى Excel
  - حذف الاستبيانات

### تصدير Excel
1. من لوحة التحكم، اضغط على زر "تصدير" بجانب أي استبيان
2. سيتم تحميل ملف Excel يحتوي على:
   - جميع الأنشطة مع التفاصيل الكاملة
   - ملخص إجمالي بالأرقام

## الألوان المستخدمة

- **البترولي** `#1E8E8E`: شريط العنوان، الأيقونات
- **الذهبي** `#B18A2D`: العناوين العربية، التفاصيل
- **السماوي** `#11B3C0`: الأرقام المهمة
- **الأحمر المرجاني** `#E44D26`: التنبيهات، الأوسمة
- **الرمادي المزرق** `#E1F1F1`: خلفيات النصوص

## API Endpoints

### المصادقة
- `POST /api/login` - تسجيل الدخول
- `POST /api/logout` - تسجيل الخروج
- `GET /api/user` - معلومات المستخدم الحالي

### الاستبيانات
- `GET /api/forms` - قائمة جميع الاستبيانات
- `POST /api/forms` - إنشاء استبيان جديد
- `GET /api/forms/{id}` - تفاصيل استبيان
- `PUT /api/forms/{id}` - تحديث استبيان
- `DELETE /api/forms/{id}` - حذف استبيان

### الأنشطة
- `GET /api/activities?form_id={id}` - قائمة الأنشطة
- `POST /api/activities` - إنشاء نشاط جديد
- `PUT /api/activities/{id}` - تحديث نشاط
- `DELETE /api/activities/{id}` - حذف نشاط

### لوحة التحكم والتصدير
- `GET /api/dashboard/summary` - ملخص جميع الاستبيانات
- `GET /api/export/excel/{form_id}` - تصدير Excel

## البنية

```
linkibnbaz/
├── backend/              # Laravel API
│   ├── app/
│   │   ├── Models/
│   │   ├── Http/Controllers/
│   │   └── Exports/
│   ├── database/migrations/
│   └── routes/
├── frontend/            # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
└── logo.jpg
```

## التطوير المستقبلي

- [ ] إمكانية إنشاء نماذج مخصصة
- [ ] تقارير إحصائية متقدمة
- [ ] إشعارات للمستخدمين
- [ ] دعم متعدد اللغات
- [ ] تطبيق موبايل

## النشر على السيرفر

### دليل النشر السريع
راجع ملف `QUICK_DEPLOY.md` للحصول على دليل سريع للنشر.

### دليل النشر الكامل
راجع ملف `DEPLOY_CHECKLIST.md` للحصول على دليل شامل خطوة بخطوة.

### استخدام Script النشر
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

### المتطلبات الأساسية للنشر
- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL/MariaDB
- Apache أو Nginx
- SSL Certificate (موصى به)

### الخطوات الأساسية
1. رفع الملفات إلى السيرفر
2. إعداد قاعدة البيانات
3. إعداد Backend (Laravel)
4. إعداد Frontend (React)
5. إعداد خادم الويب (Apache/Nginx)
6. الاختبار

للمزيد من التفاصيل، راجع `DEPLOY_CHECKLIST.md`.

## الترخيص

MIT License

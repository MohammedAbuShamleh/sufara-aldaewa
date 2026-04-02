# ✅ قائمة فحص النشر على السيرفر

استخدم هذه القائمة خطوة بخطوة لنشر التطبيق على السيرفر.

## 📋 قبل البدء

- [ ] تأكد من أن لديك وصول SSH إلى السيرفر
- [ ] تأكد من أن لديك وصول إلى cPanel أو لوحة التحكم (إذا كانت متوفرة)
- [ ] تأكد من أن لديك معلومات قاعدة البيانات (اسم، مستخدم، كلمة مرور)
- [ ] تأكد من أن لديك اسم الدومين (Domain)

---

## 🔧 متطلبات السيرفر

### Backend (Laravel):
- [ ] PHP >= 8.2
- [ ] Composer مثبت
- [ ] MySQL/MariaDB أو PostgreSQL
- [ ] Apache أو Nginx
- [ ] PHP Extensions: `pdo`, `pdo_mysql`, `mbstring`, `xml`, `curl`, `zip`, `gd`, `fileinfo`

### Frontend (React):
- [ ] Node.js >= 18
- [ ] npm أو yarn

**للتحقق من المتطلبات:**
```bash
php -v          # يجب أن يكون >= 8.2
composer -v     # يجب أن يكون مثبت
node -v         # يجب أن يكون >= 18
npm -v          # يجب أن يكون مثبت
mysql --version # يجب أن يكون مثبت
```

---

## 📦 الخطوة 1: رفع الملفات إلى السيرفر

### الطريقة 1: استخدام Git (موصى به)
```bash
# على السيرفر
cd /path/to/your/project
git clone https://your-repo-url.git
cd linkibnbaz
```

### الطريقة 2: استخدام FTP/SFTP
- [ ] رفع مجلد `backend` كاملاً (بدون `vendor` و `node_modules`)
- [ ] رفع مجلد `frontend` كاملاً (بدون `node_modules` و `dist`)
- [ ] رفع ملفات `.gitignore` و `README.md` (اختياري)

**ملاحظة:** لا ترفع:
- ❌ `node_modules/`
- ❌ `vendor/`
- ❌ `dist/`
- ❌ `.env`
- ❌ `*.log`

---

## 🗄️ الخطوة 2: إعداد قاعدة البيانات

- [ ] إنشاء قاعدة بيانات جديدة من cPanel أو phpMyAdmin
- [ ] إنشاء مستخدم لقاعدة البيانات وإعطائه جميع الصلاحيات
- [ ] تسجيل معلومات قاعدة البيانات:
  - اسم قاعدة البيانات: `_________________`
  - اسم المستخدم: `_________________`
  - كلمة المرور: `_________________`
  - Host: `_________________` (عادة `localhost` أو `127.0.0.1`)

---

## ⚙️ الخطوة 3: إعداد Backend (Laravel)

### 3.1: إنشاء ملف .env
```bash
cd backend
cp .env.example .env
```

- [ ] فتح ملف `.env` وتعديل الإعدادات التالية:

```env
APP_NAME="Link Ibn Baz"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

SESSION_DRIVER=database
SESSION_LIFETIME=120
```

### 3.2: تثبيت Dependencies
```bash
composer install --optimize-autoloader --no-dev
```
- [ ] تم تنفيذ الأمر بنجاح

### 3.3: توليد APP_KEY
```bash
php artisan key:generate
```
- [ ] تم توليد المفتاح بنجاح

### 3.4: تشغيل Migrations
```bash
php artisan migrate --force
```
- [ ] تم إنشاء الجداول بنجاح

### 3.5: إنشاء Storage Link
```bash
php artisan storage:link
```
- [ ] تم إنشاء الرابط بنجاح

### 3.6: تحسين الأداء
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```
- [ ] تم تحسين الأداء بنجاح

### 3.7: إعداد الصلاحيات
```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
chown -R www-data:www-data storage
chown -R www-data:www-data bootstrap/cache
```
- [ ] تم إعداد الصلاحيات بنجاح

---

## 🎨 الخطوة 4: إعداد Frontend (React)

### 4.1: تثبيت Dependencies
```bash
cd ../frontend
npm install
```
- [ ] تم تثبيت الحزم بنجاح

### 4.2: بناء المشروع للإنتاج
```bash
npm run build
```
- [ ] تم بناء المشروع بنجاح
- [ ] تم إنشاء مجلد `dist/` مع الملفات

### 4.3: التحقق من ملف .htaccess
- [ ] تأكد من وجود ملف `.htaccess` في `frontend/public/.htaccess`
- [ ] سيتم نسخه تلقائياً إلى `dist/` عند البناء

---

## 🌐 الخطوة 5: إعداد خادم الويب

### الخيار أ: Apache (cPanel)

#### 5.1: إعداد Backend API
- [ ] إنشاء Subdomain: `api.yourdomain.com`
- [ ] ربط Document Root بـ: `/path/to/backend/public`
- [ ] التأكد من تفعيل mod_rewrite

#### 5.2: إعداد Frontend
- [ ] ربط Document Root للدومين الرئيسي بـ: `/path/to/frontend/dist`
- [ ] التأكد من تفعيل mod_rewrite

#### 5.3: إعداد Proxy (إذا كان Backend و Frontend في نفس الدومين)
في ملف `.htaccess` الخاص بالـ Frontend، أضف:
```apache
# Proxy API requests
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:8000/api/$1 [P,L]
```

### الخيار ب: Nginx

- [ ] إعداد Virtual Host للـ Frontend
- [ ] إعداد Virtual Host للـ Backend API
- [ ] إعداد Proxy للـ API (إذا لزم الأمر)

---

## 🔒 الخطوة 6: إعدادات الأمان

- [ ] تأكد من أن `APP_DEBUG=false` في `.env`
- [ ] تأكد من أن `APP_ENV=production` في `.env`
- [ ] تأكد من تحديث `CORS_ALLOWED_ORIGINS` في `.env`
- [ ] تأكد من تفعيل HTTPS/SSL
- [ ] تأكد من أن ملف `.env` غير قابل للوصول من المتصفح

---

## 🧪 الخطوة 7: الاختبار

### اختبار Backend:
- [ ] فتح: `https://api.yourdomain.com/api/forms` (يجب أن يعرض JSON)
- [ ] فتح: `https://api.yourdomain.com/api/activities` (يجب أن يعرض JSON)

### اختبار Frontend:
- [ ] فتح: `https://yourdomain.com` (يجب أن تظهر الصفحة الرئيسية)
- [ ] اختبار تسجيل الدخول
- [ ] اختبار ملء النموذج
- [ ] اختبار عرض البيانات في Dashboard
- [ ] اختبار التصدير إلى Excel

### اختبار CORS:
- [ ] فتح Console في المتصفح (F12)
- [ ] التأكد من عدم وجود أخطاء CORS

---

## 🐛 استكشاف الأخطاء

### مشكلة: 500 Error في Laravel
```bash
# تحقق من السجلات
tail -f backend/storage/logs/laravel.log

# مسح الكاش
cd backend
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache
```

### مشكلة: CORS Error
- [ ] تأكد من تحديث `CORS_ALLOWED_ORIGINS` في `.env`
- [ ] تأكد من مسح الكاش: `php artisan config:clear`

### مشكلة: Route Not Found
```bash
cd backend
php artisan route:clear
php artisan route:cache
php artisan config:cache
```

### مشكلة: Database Connection Error
- [ ] تحقق من بيانات الاتصال في `.env`
- [ ] تأكد من أن قاعدة البيانات موجودة
- [ ] تحقق من صلاحيات المستخدم

### مشكلة: Frontend لا يعرض الصفحات
- [ ] تأكد من وجود ملف `.htaccess` في `dist/`
- [ ] تأكد من إعداد mod_rewrite في Apache
- [ ] تحقق من Document Root

---

## ✅ بعد النشر

- [ ] عمل Backup لقاعدة البيانات
- [ ] إعداد Backup تلقائي (إن أمكن)
- [ ] مراقبة السجلات: `backend/storage/logs/laravel.log`
- [ ] إعداد Monitoring (اختياري)

---

## 📞 معلومات مهمة

**مسار Backend على السيرفر:** `_________________`
**مسار Frontend على السيرفر:** `_________________`
**رابط API:** `https://api.yourdomain.com`
**رابط الموقع:** `https://yourdomain.com`
**معلومات قاعدة البيانات:** (محفوظة في `.env`)

---

## 🎉 تم النشر بنجاح!

إذا أكملت جميع الخطوات أعلاه، يجب أن يكون التطبيق يعمل الآن على السيرفر.

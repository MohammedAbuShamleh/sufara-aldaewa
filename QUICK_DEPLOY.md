# 🚀 دليل النشر السريع

دليل مختصر لنشر التطبيق على السيرفر في خطوات سريعة.

## 📝 الخطوات الأساسية

### 1️⃣ رفع الملفات
```bash
# على السيرفر
git clone https://your-repo-url.git
cd linkibnbaz
```

أو رفع الملفات عبر FTP/SFTP (بدون `node_modules`, `vendor`, `dist`)

---

### 2️⃣ إعداد قاعدة البيانات
- إنشاء قاعدة بيانات جديدة
- تسجيل المعلومات: اسم، مستخدم، كلمة مرور

---

### 3️⃣ إعداد Backend
```bash
cd backend
cp .env.example .env
# تعديل .env وإضافة معلومات قاعدة البيانات
composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
chmod -R 775 storage bootstrap/cache
```

**ملف .env المطلوب:**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

### 4️⃣ إعداد Frontend
```bash
cd ../frontend
npm install
npm run build
```

---

### 5️⃣ إعداد خادم الويب

#### Apache (cPanel):
- **Backend:** إنشاء Subdomain `api.yourdomain.com` → Document Root: `backend/public`
- **Frontend:** الدومين الرئيسي → Document Root: `frontend/dist`

#### أو استخدام Script:
```bash
./deploy-production.sh
```

---

### 6️⃣ الاختبار
- ✅ `https://yourdomain.com` - يجب أن تظهر الصفحة الرئيسية
- ✅ `https://api.yourdomain.com/api/forms` - يجب أن يعرض JSON
- ✅ تسجيل الدخول
- ✅ ملء النموذج

---

## ⚠️ مشاكل شائعة

### 500 Error:
```bash
cd backend
tail -f storage/logs/laravel.log
php artisan config:clear
php artisan route:clear
```

### CORS Error:
- تحديث `CORS_ALLOWED_ORIGINS` في `.env`
- `php artisan config:clear && php artisan config:cache`

### Route Not Found:
```bash
php artisan route:clear
php artisan route:cache
```

---

## 📚 للمزيد من التفاصيل

راجع ملف `DEPLOY_CHECKLIST.md` للدليل الكامل خطوة بخطوة.

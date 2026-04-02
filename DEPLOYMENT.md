# دليل رفع النظام على السيرفر

## متطلبات السيرفر

### Backend (Laravel):
- PHP >= 8.2
- Composer
- MySQL/MariaDB أو PostgreSQL
- Apache أو Nginx
- PHP Extensions: `pdo`, `pdo_mysql`, `mbstring`, `xml`, `curl`, `zip`, `gd`, `fileinfo`

### Frontend (React):
- Node.js >= 18
- npm أو yarn

---

## خطوات الرفع

### 1. إعداد Backend (Laravel)

#### أ. رفع الملفات:
```bash
# رفع جميع ملفات backend إلى السيرفر
# يجب أن يكون public folder هو document root
```

#### ب. إعداد قاعدة البيانات:
```bash
# إنشاء قاعدة بيانات جديدة
# تعديل ملف .env:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

#### ج. تثبيت Dependencies:
```bash
cd backend
composer install --optimize-autoloader --no-dev
```

#### د. إعداد Laravel:
```bash
# نسخ ملف .env
cp .env.example .env

# توليد APP_KEY
php artisan key:generate

# تشغيل Migrations
php artisan migrate --force

# إنشاء Storage Link
php artisan storage:link

# تحسين الأداء
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### هـ. إعداد Apache (.htaccess):
تأكد من أن ملف `backend/public/.htaccess` موجود ويحتوي على:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

#### و. إعداد Document Root:
- يجب أن يكون `backend/public` هو Document Root للـ API
- مثال: `https://api.yourdomain.com` → يشير إلى `backend/public`

---

### 2. إعداد Frontend (React)

#### أ. بناء المشروع:
```bash
cd frontend
npm install
npm run build
```

#### ب. رفع الملفات:
```bash
# رفع محتويات مجلد dist/ إلى السيرفر
# يجب أن يكون dist/ هو document root للـ frontend
```

#### ج. إعداد .htaccess:
تأكد من وجود ملف `.htaccess` في مجلد `dist/` (تم إنشاؤه في `frontend/public/.htaccess`)

#### د. تحديث API URL:
في ملف `frontend/src/services/api.ts`، تأكد من أن `baseURL` يشير إلى عنوان API الصحيح:
```typescript
const api = axios.create({
  baseURL: 'https://api.yourdomain.com/api', // أو '/api' إذا كان في نفس الدومين
  // ...
})
```

---

### 3. إعدادات Apache

#### إذا كان Backend و Frontend في نفس الدومين:

**Virtual Host للـ Frontend:**
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /path/to/frontend/dist
    
    <Directory /path/to/frontend/dist>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Proxy API requests to Laravel
    ProxyPreserveHost On
    ProxyPass /api http://localhost:8000/api
    ProxyPassReverse /api http://localhost:8000/api
</VirtualHost>
```

**Virtual Host للـ Backend (اختياري):**
```apache
<VirtualHost *:80>
    ServerName api.yourdomain.com
    DocumentRoot /path/to/backend/public
    
    <Directory /path/to/backend/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

### 4. إعدادات Nginx

#### Frontend:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Backend:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /path/to/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

### 5. إعدادات CORS

أضف في `backend/.env` على السيرفر دومين الفرونت إند الذي يطلب الـ API:
```env
# مثال عندما يكون الفرونت على https://forms-preachers.ibnbazgaza.org
CORS_ALLOWED_ORIGINS=https://forms-preachers.ibnbazgaza.org,https://form.ibnbazgaza.org

# للتطوير المحلي (فرونت على localhost:5173 أو 5174) ضد API الإنتاج أضف:
# http://localhost:5174,http://127.0.0.1:5174
# أو انشر config/cors.php المحدّث (يسمح بأي منفذ على localhost عبر allowed_origins_patterns)

# إن استخدمت تسجيل الدخول من الفرونت، أضف الدومين هنا أيضاً:
SANCTUM_STATEFUL_DOMAINS=forms-preachers.ibnbazgaza.org,form.ibnbazgaza.org
```

بعد تعديل `.env` أو `config/cors.php`:
```bash
php artisan config:clear
php artisan config:cache
# أعد تشغيل php-fpm إن لزم
```

---

### 6. الأمان

#### أ. ملف .env:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# قاعدة البيانات
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_strong_password

# Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
```

#### ب. الصلاحيات:
```bash
# إعطاء صلاحيات للـ storage و cache
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache
chown -R www-data:www-data backend/storage
chown -R www-data:www-data backend/bootstrap/cache
```

---

### 7. اختبار النظام

1. افتح المتصفح واذهب إلى `https://yourdomain.com`
2. تأكد من أن API يعمل: `https://api.yourdomain.com/api/forms`
3. اختبر تسجيل الدخول
4. اختبر ملء النموذج
5. اختبر التصدير

---

### 8. استكشاف الأخطاء

#### مشاكل شائعة:

**1. 500 Error في Laravel:**
```bash
# تحقق من السجلات
tail -f backend/storage/logs/laravel.log

# تحقق من الصلاحيات
ls -la backend/storage
ls -la backend/bootstrap/cache
```

**2. CORS Error (مثل: No 'Access-Control-Allow-Origin' header):**
- أضف دومين الفرونت في `backend/.env`:  
  `CORS_ALLOWED_ORIGINS=https://forms-preachers.ibnbazgaza.org`
- للتطوير المحلي (فرونت على localhost:5174 أو غيره) ضد API الإنتاج أضف:  
  `http://localhost:5174,http://127.0.0.1:5174` (أو انشر `config/cors.php` المحدّث الذي يسمح بأي منفذ على localhost)
- شغّل: `php artisan config:clear` ثم `php artisan config:cache`
- تأكد من أن `APP_URL` صحيح في `.env`

**3. Route Not Found:**
```bash
# مسح الكاش
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

**4. Database Connection Error:**
- تحقق من بيانات الاتصال في `.env`
- تأكد من أن قاعدة البيانات موجودة
- تحقق من صلاحيات المستخدم

---

## ملاحظات مهمة

1. **لا ترفع ملف `.env`** - يجب إنشاؤه على السيرفر
2. **لا ترفع `node_modules`** - قم بتشغيل `npm install` على السيرفر
3. **لا ترفع `vendor`** - قم بتشغيل `composer install` على السيرفر
4. **استخدم HTTPS** في الإنتاج
5. **فعّل SSL Certificate** لحماية البيانات
6. **قم بعمل Backup** لقاعدة البيانات بانتظام

---

## أوامر مفيدة

```bash
# Backend
cd backend
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
cd frontend
npm install
npm run build

# رفع dist/ إلى السيرفر
```

---

## الدعم

إذا واجهت أي مشاكل، تحقق من:
- Laravel Logs: `backend/storage/logs/laravel.log`
- Apache/Nginx Error Logs
- Browser Console (F12)

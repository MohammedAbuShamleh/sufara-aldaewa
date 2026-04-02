<?php
// بعد تعديل .env أو هذا الملف على السيرفر: php artisan config:clear ثم php artisan config:cache

$origins = array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'https://forms-preachers.ibnbazgaza.org,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174')))));
if (empty($origins)) {
    $origins = ['https://forms-preachers.ibnbazgaza.org', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
}

// أنماط للسماح بأي منفذ على localhost/127.0.0.1 (مثلاً 5174 عندما 5173 مشغول)
$allowed_origins_patterns = [
    '/^https?:\/\/localhost(:\d+)?$/',
    '/^https?:\/\/127\.0\.0\.1(:\d+)?$/',
];

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => $allowed_origins_patterns,
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400, // تخزين Preflight 24 ساعة
    'supports_credentials' => true,
];

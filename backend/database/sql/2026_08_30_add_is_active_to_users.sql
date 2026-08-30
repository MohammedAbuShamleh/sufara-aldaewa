-- =====================================================================
--  تعطيل المستخدمين بدل حذفهم — عمودا الحالة على جدول users
--  للتنفيذ على قاعدة بيانات الإنتاج (MySQL / MariaDB) عبر phpMyAdmin
--  أو سطر الأوامر، بديلاً عن تشغيل php artisan migrate.
--
--  يقابل هذا الملف الهجرة:
--    2026_08_30_000001_add_is_active_to_users_table
--
--  ⚠ هذا الملف كان ناقصاً: الميزة رُفعت بلا مقابل SQL لها، فإن كان النشر
--  يتمّ بتنفيذ ملفات SQL يدوياً فالعمودان غير موجودين على الإنتاج — وهذا
--  يُسقط /api/users و/api/dashboard/summary بخطأ 500
--  (Unknown column 'is_active').
--
--  ⚠ خذ نسخة احتياطية من قاعدة البيانات قبل التنفيذ.
-- =====================================================================

SET NAMES utf8mb4;


-- ── 1) العمودان ───────────────────────────────────────────────────────
--  is_active   : هل يُسمح للحساب بالدخول؟ الافتراضي 1 — فكل الحسابات
--                القائمة تبقى فعّالة بعد التنفيذ ولا يتعطّل أحد.
--  disabled_at : لحظة التعطيل، تُعرض في كشف الإدارة وتُمسح عند التفعيل.
--
--  ⚠ إن كان العمود موجوداً مسبقاً سيُرجع خطأ 1060 (Duplicate column) —
--  وهو آمن. للتأكّد قبل التنفيذ:
--    SHOW COLUMNS FROM `users` WHERE Field IN ('is_active','disabled_at');

ALTER TABLE `users`
  ADD COLUMN `is_active` tinyint(1) NOT NULL DEFAULT '1' AFTER `role`,
  ADD COLUMN `disabled_at` timestamp NULL DEFAULT NULL AFTER `is_active`;


-- ── 2) تسجيل الـ migration كمنفّذة ────────────────────────────────────
--  السطر آمن للتكرار: لن يُضيف صفاً ثانياً إن كان مسجّلاً مسبقاً.

INSERT INTO `migrations` (`migration`, `batch`)
SELECT
  '2026_08_30_000001_add_is_active_to_users_table',
  (SELECT COALESCE(MAX(`batch`), 0) + 1 FROM `migrations` AS `b`)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `migrations` AS `m`
  WHERE `m`.`migration` = '2026_08_30_000001_add_is_active_to_users_table'
);


-- ── 3) تحقّق بعد التنفيذ ──────────────────────────────────────────────
--  المتوقع: عمودان، وكل الحسابات القائمة is_active = 1.

-- SHOW COLUMNS FROM `users` WHERE Field IN ('is_active','disabled_at');
-- SELECT `is_active`, COUNT(*) FROM `users` GROUP BY `is_active`;

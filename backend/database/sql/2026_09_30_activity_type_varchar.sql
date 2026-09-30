-- =====================================================================
--  إصلاح: نشاط «الحلقات العلمية (مراقي العلم)» لا يُحفظ
--  للتنفيذ على قاعدة بيانات الإنتاج (MySQL / MariaDB) عبر phpMyAdmin
--  أو سطر الأوامر، بديلاً عن تشغيل php artisan migrate.
--
--  يقابل هذا الملف الهجرة:
--    2026_09_30_000001_change_activity_type_to_string_in_activities
--
--  السبب: العمود activities.activity_type أُنشئ ENUM بالأنواع التسعة
--  الأولى فقط، فترفض قاعدة البيانات القيمة الجديدة 'scientific_circle'
--  بخطأ 1265 «Data truncated for column 'activity_type'» ويظهر للداعية
--  «فشل حفظ النشاط». بقية الأقسام تعمل لأن قيمها موجودة في القائمة.
--
--  الإصلاح: تحويل العمود إلى VARCHAR — القيم المسموحة محكومة أصلاً في
--  كود التحقّق (ActivityController)، فلا يتكرّر العطل مع أي نوع قادم.
--  القيم المخزّنة حالياً تبقى كما هي دون أي تغيير.
--
--  ⚠ خذ نسخة احتياطية من قاعدة البيانات قبل التنفيذ.
-- =====================================================================

SET NAMES utf8mb4;


-- ── 0) تحقّق قبل التنفيذ ──────────────────────────────────────────────
--  المتوقع الآن: Type = enum('preaching_lesson', ... ,'other') بلا scientific_circle

-- SHOW COLUMNS FROM `activities` LIKE 'activity_type';


-- ── 1) تحويل العمود إلى نصّ ───────────────────────────────────────────
--  آمن للتكرار: إن كان VARCHAR مسبقاً فلن يتغيّر شيء.

ALTER TABLE `activities`
  MODIFY `activity_type` varchar(255) NOT NULL;


-- ── 2) تسجيل الـ migration كمنفّذة ────────────────────────────────────
--  آمن للتكرار: لن يُضيف صفاً ثانياً إن كان مسجّلاً مسبقاً.

INSERT INTO `migrations` (`migration`, `batch`)
SELECT
  '2026_09_30_000001_change_activity_type_to_string_in_activities',
  (SELECT COALESCE(MAX(`batch`), 0) + 1 FROM `migrations` AS `b`)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `migrations` AS `m`
  WHERE `m`.`migration` = '2026_09_30_000001_change_activity_type_to_string_in_activities'
);


-- ── 3) تحقّق بعد التنفيذ ──────────────────────────────────────────────
--  المتوقع: Type = varchar(255)، ثم جرّب حفظ نشاط في «الحلقات العلمية».

-- SHOW COLUMNS FROM `activities` LIKE 'activity_type';

-- =====================================================================
--  الحلقات العلمية (مراقي العلم) — حقلا النشاط الجديدان + الصفتان الجديدتان
--  للتنفيذ على قاعدة بيانات الإنتاج (MySQL / MariaDB) عبر phpMyAdmin
--  أو سطر الأوامر، بديلاً عن تشغيل php artisan migrate.
--
--  يقابل هذا الملف الهجرة:
--    2026_08_31_000001_add_scientific_circle_fields_to_activities
--  ويضيف إليها بذور الصفتين الجديدتين (كانتا تُزرعان عبر TagSeeder).
--
--  ⚠ خذ نسخة احتياطية من قاعدة البيانات قبل التنفيذ.
--
--  ملاحظة: البرنامج الثالث 'joint' لا يحتاج تعديلاً على البنية لأن
--  users.program_type من النوع VARCHAR. أما نوع النشاط 'scientific_circle'
--  فيحتاجه: activities.activity_type أُنشئ ENUM بالأنواع التسعة الأولى —
--  نفّذ معه 2026_09_30_activity_type_varchar.sql وإلا رُفض حفظ الحلقات
--  العلمية بخطأ 1265 «Data truncated».
-- =====================================================================

SET NAMES utf8mb4;


-- ── 1) عمودا نشاط الحلقات العلمية ─────────────────────────────────────
--  program_name     : اسم البرنامج (النابغة الصغير / غرس البذور /
--                     تحصيل العلم / تأصيل العلم)
--  completed_amount : القدر المنجز (المواضيع المشروحة أو الصفحات) —
--                     نصّ حرّ لأن الوحدة تختلف بين برنامج وآخر.
--
--  بقية حقول القسم تُعيد استخدام أعمدة قائمة: اسم الكتاب في `details`،
--  وعدد الطلاب في `beneficiaries_count`، ومكان التنفيذ في `location`.
--
--  ⚠ MySQL/MariaDB لا تدعم ADD COLUMN IF NOT EXISTS في كل الإصدارات،
--  فإن كان العمود موجوداً مسبقاً سيُرجع خطأ 1060 (Duplicate column) —
--  وهو خطأ آمن يمكن تجاهله. للتأكد قبل التنفيذ:
--    SHOW COLUMNS FROM `activities` LIKE 'program\_name';

ALTER TABLE `activities`
  ADD COLUMN `program_name` varchar(255) DEFAULT NULL AFTER `details`,
  ADD COLUMN `completed_amount` varchar(255) DEFAULT NULL AFTER `program_name`;


-- ── 2) تسجيل الـ migration كمنفّذة ────────────────────────────────────
--  بدون هذا السطر سيحاول `php artisan migrate` لاحقاً إضافة العمودين من
--  جديد. (الهجرة نفسها تتخطى الإضافة عبر Schema::hasColumn، لكن تسجيلها
--  هنا يُبقي حالة الهجرات نظيفة ومتطابقة مع الواقع.)
--  السطر آمن للتكرار: لن يُضيف صفاً ثانياً إن كان مسجّلاً مسبقاً.

INSERT INTO `migrations` (`migration`, `batch`)
SELECT
  '2026_08_31_000001_add_scientific_circle_fields_to_activities',
  (SELECT COALESCE(MAX(`batch`), 0) + 1 FROM `migrations` AS `b`)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `migrations` AS `m`
  WHERE `m`.`migration` = '2026_08_31_000001_add_scientific_circle_fields_to_activities'
);


-- ── 3) الصفتان الجديدتان (الصفات طبقة تصنيف فقط، لا تمنح صلاحية) ──────
--  تقابلان ما أُضيف إلى Tag::SEED_NAMES. كل سطر آمن للتكرار.

INSERT INTO `tags` (`name`, `created_at`, `updated_at`)
SELECT 'مسؤول ملف مراقي العلم', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tags` AS `t` WHERE `t`.`name` = 'مسؤول ملف مراقي العلم'
);

INSERT INTO `tags` (`name`, `created_at`, `updated_at`)
SELECT 'مسؤول ملف العطاء العلمي', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tags` AS `t` WHERE `t`.`name` = 'مسؤول ملف العطاء العلمي'
);


-- ── 4) تحقّق بعد التنفيذ ──────────────────────────────────────────────
--  المتوقع: عمودان جديدان، وصف واحد في migrations، وأربعة عشر صفّ صفات.

-- SHOW COLUMNS FROM `activities` LIKE '%program_name%';
-- SHOW COLUMNS FROM `activities` LIKE '%completed_amount%';
-- SELECT * FROM `migrations`
--   WHERE `migration` = '2026_08_31_000001_add_scientific_circle_fields_to_activities';
-- SELECT `id`, `name` FROM `tags` ORDER BY `id`;

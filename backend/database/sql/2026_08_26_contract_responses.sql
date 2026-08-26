-- =====================================================================
--  عقد الكفالة الإلكتروني — جدول ردود المستخدمين
--  للتنفيذ على قاعدة بيانات الإنتاج (MySQL / MariaDB) عبر phpMyAdmin
--  أو سطر الأوامر، بديلاً عن تشغيل php artisan migrate.
--
--  وُلِّد هذا الملف من الـ migration نفسه بعد تشغيله على MariaDB،
--  فهو مطابق لما كان Laravel سيُنشئه تماماً.
--
--  ⚠ خذ نسخة احتياطية من قاعدة البيانات قبل التنفيذ.
--
--  يفترض أن جدول `users` موجود وأن عموده `id` من النوع
--  BIGINT(20) UNSIGNED (وهو الوضع الطبيعي في هذا المشروع)،
--  وإلا فشل إنشاء المفتاح الأجنبي.
-- =====================================================================

-- ── 1) إنشاء الجدول ───────────────────────────────────────────────────
--  decision: 'agreed' موافق | 'declined' غير موافق
--            ومن لا صفّ له فهو «لم يردّ بعد».
--  responded_at من نوع DATETIME عمداً لا TIMESTAMP: عمود TIMESTAMP في
--  MySQL/MariaDB يلتقط ضمنياً «ON UPDATE CURRENT_TIMESTAMP» فتُعاد كتابة
--  لحظة الرد مع أي تحديث للصف، وهذا يفسد قيمتها كسجل إثبات.

CREATE TABLE IF NOT EXISTS `contract_responses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `contract_version` varchar(255) NOT NULL,
  `decision` varchar(255) NOT NULL DEFAULT 'agreed',
  `responded_at` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contract_responses_user_id_contract_version_unique` (`user_id`,`contract_version`),
  CONSTRAINT `contract_responses_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 2) تسجيل الـ migration كمنفّذة ────────────────────────────────────
--  بدون هذا السطر سيحاول `php artisan migrate` لاحقاً إنشاء الجدول من
--  جديد. (الـ migration نفسها تتخطى الإنشاء إن وجدت الجدول، لكن تسجيلها
--  هنا يُبقي حالة الهجرات نظيفة ومتطابقة مع الواقع.)
--  السطر آمن للتكرار: لن يُضيف صفاً ثانياً إن كان مسجّلاً مسبقاً.

INSERT INTO `migrations` (`migration`, `batch`)
SELECT
  '2026_08_26_000001_create_contract_responses_table',
  (SELECT COALESCE(MAX(`batch`), 0) + 1 FROM `migrations` AS `b`)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `migrations` AS `m`
  WHERE `m`.`migration` = '2026_08_26_000001_create_contract_responses_table'
);


-- ── 3) تحقّق بعد التنفيذ ──────────────────────────────────────────────
--  المتوقع: الجدول موجود وفارغ، وسطر واحد في جدول migrations.

-- SELECT COUNT(*) AS contract_rows FROM `contract_responses`;
-- SELECT * FROM `migrations`
--   WHERE `migration` = '2026_08_26_000001_create_contract_responses_table';

-- =====================================================================
--  دعم تعدّد المحافظات لمسؤول المحافظة + ضبط مشرفي الدائرة الدعوية
--  للتنفيذ على قاعدة بيانات الإنتاج (MySQL / MariaDB).
--
--  يقابل القسمُ الأول الهجرةَ:
--    2026_08_31_000002_add_extra_governorates_to_users_table
--
--  ⚠ هذا الملف يتطلّب رفع الباك إند الجديد أولاً — العمود وحده لا يكفي،
--  فمنطق النطاق (User::scopedGovernorates و scopeVisibleToViewer)
--  في الكود. لو نُفِّذ الـ SQL دون رفع الكود لم يتغيّر شيء في السلوك.
--
--  ⚠ خذ نسخة احتياطية من قاعدة البيانات قبل التنفيذ.
-- =====================================================================

SET NAMES utf8mb4;


-- ── 1) العمود الجديد ──────────────────────────────────────────────────
--  محافظات إضافية ضمن نطاق مسؤول المحافظة، مفصولة بفاصلة (عربية أو
--  لاتينية). لم نوسّع العمود governorate نفسه لأنه مصدر «محافظة المستخدم»
--  المعروضة في التقارير والمشتقّة منها قائمة الفلترة — فحشو قائمة فيه
--  يُفسد الاثنين.
--
--  ⚠ خطأ 1060 (Duplicate column) إن كان منفَّذاً سلفاً — آمن.

ALTER TABLE `users`
  ADD COLUMN `extra_governorates` varchar(255) DEFAULT NULL AFTER `governorate`;


-- ── 2) تسجيل الـ migration كمنفّذة ────────────────────────────────────

INSERT INTO `migrations` (`migration`, `batch`)
SELECT
  '2026_08_31_000002_add_extra_governorates_to_users_table',
  (SELECT COALESCE(MAX(`batch`), 0) + 1 FROM `migrations` AS `b`)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `migrations` AS `m`
  WHERE `m`.`migration` = '2026_08_31_000002_add_extra_governorates_to_users_table'
);


-- ── 3) علاء العرقان: يغطّي خان يونس + رفح ─────────────────────────────
--  محافظته الأساسية «خان يونس» تبقى كما هي، ونضيف «رفح» إلى نطاقه.
--  دوره governorate_manager أصلاً فلا نغيّره.

UPDATE `users`
SET `extra_governorates` = 'رفح'
WHERE `id_number` = '900551235';


-- ── 4) أحمد الشلح: ترقية إلى مسؤول مركزي + تصحيح البرنامج ─────────────
--  كان مسجّلاً «داعية» ببرنامج علمي؛ وهو مسؤول الدائرة الدعوية المركزي.
--  المركزي ضمن ALL_REPORTS_ROLES فيرى كل المحافظات، ولذلك لا معنى
--  لمحافظته في النطاق — لكنّا نُبقيها لأنها بيانات شخصية صحيحة.

UPDATE `users`
SET `role` = 'central_manager',
    `program_type` = 'dawah',
    `administrative_title` = 'مسؤول الدائرة الدعوية المركزية'
WHERE `id_number` = '913800363';


-- ── 5) ربط الصفة (اختياري — للفرز لا للصلاحية) ────────────────────────

INSERT INTO `tag_user` (`tag_id`, `user_id`)
SELECT `t`.`id`, `u`.`id`
FROM `tags` AS `t`
JOIN `users` AS `u` ON `u`.`id_number` = '913800363'
WHERE `t`.`name` = 'مسؤول الدائرة الدعوية المركزية'
  AND NOT EXISTS (
    SELECT 1 FROM `tag_user` AS `x`
    WHERE `x`.`tag_id` = `t`.`id` AND `x`.`user_id` = `u`.`id`
  );


-- ── 6) تحقّق بعد التنفيذ ──────────────────────────────────────────────

-- SELECT `name`, `id_number`, `role`, `governorate`, `extra_governorates`,
--        `program_type`, `administrative_title`
--   FROM `users`
--  WHERE `id_number` IN ('900551235','913800363','804332609','901384990','800272742')
--  ORDER BY `name`;

--  المتوقّع:
--   علاء العرقان   governorate_manager  خان يونس  extra=رفح
--   أحمد الشلح     central_manager      خان يونس  program=dawah
--   حازم مهدي      governorate_manager  الوسطى    (بلا تغيير)
--   محمد حمادة     governorate_manager  غزة       (بلا تغيير)
--   احميد قديح     admin_secretary                (بلا تغيير — يرى الجميع)

-- =====================================================================
--  حسابات المشرفين المطّلعين على التقارير (ستة حسابات)
--  للتنفيذ على قاعدة بيانات الإنتاج (MySQL / MariaDB).
--
--  ثلاثة مسؤولي محافظات + ثلاثة مركزيين:
--    ربيع أبو هولي   — الوسطى        (governorate_manager)
--    يوسف بدوي      — غزة           (governorate_manager)
--    سعيد الكرد     — رفح           (governorate_manager)
--    أحمد فسيفس     — مركزي         (central_manager) — ملف مراقي العلم
--    مهند السيد     — مركزي         (central_manager) — ملف العطاء العلمي
--    تقي الدين يونس — مركزي         (central_manager) — الدائرة العلمية
--
--  الملف آمن لإعادة التنفيذ: الحماية على id_number، فتشغيله مرة أخرى
--  بعد إضافة حساب جديد يُدرج الناقص وحده ولا يكرّر القائم.
--
--  نطاق الرؤية (User::scopeVisibleToViewer):
--   • governorate_manager يرى دعاة محافظته فقط — المطابقة نصّية على
--     العمود `governorate`.
--   • central_manager ضمن ALL_REPORTS_ROLES فيرى الجميع، ولذلك تُترك
--     محافظته NULL.
--
--  ⚠ خذ نسخة احتياطية من قاعدة البيانات قبل التنفيذ.
-- =====================================================================

SET NAMES utf8mb4;


-- ── 0) تحقّق قبل التنفيذ: إملاء المحافظات ─────────────────────────────
--  ⚠⚠ الأهمّ في هذا الملف. المطابقة نصّية حرفية، فلو كُتبت المحافظة هنا
--  بإملاء يختلف عمّا في حسابات الدعاة (مسافة زائدة، «ال» التعريف، أو
--  «الوسطى» مقابل «المنطقة الوسطى») فلن يرى المشرف أيّ داعية — دون أي
--  رسالة خطأ. شغّل هذا الاستعلام أولاً وطابِق القيم مع ما في الجدول أدناه:

-- SELECT `governorate`, COUNT(*) AS `عدد`
--   FROM `users` WHERE `governorate` IS NOT NULL AND `governorate` <> ''
--   GROUP BY `governorate` ORDER BY `عدد` DESC;

--  إن لم تظهر «رفح» في النتيجة فهذا طبيعي (لا دعاة بها بعد) — قائمة
--  المحافظات في اللوحة تُشتقّ من البيانات، فستظهر تلقائياً بعد إضافة
--  أول حساب بها، وهذا الملف يضيفه.


-- ── 1) إنشاء الحسابات ─────────────────────────────────────────────────
--  • الدخول برقم الهوية (`id_number`) لا بالبريد — كما في بقية حسابات
--    المشرفين. لذلك `email` = NULL عمداً: العمود عليه فهرس UNIQUE،
--    والقيمة NULL تتكرّر بلا تعارض بخلاف السلسلة الفارغة ''.
--  • أرقام الهوية أدناه مؤقّتة (900000030–900000034) على نمط الحسابات
--    القائمة. استبدلها بأرقام الهوية الحقيقية إن رغبت — فهي اسم
--    المستخدم الذي سيدخلون به.
--  • كلمات المرور مؤقّتة ومذكورة في الجدول أسفل الملف — غيّرها من لوحة
--    الإدارة بعد أول دخول.
--  • is_active = 1 ليدخلوا مباشرة؛ زر «تعطيل» في اللوحة يقلبها لاحقاً.
--
--  السطر آمن للتكرار: WHERE NOT EXISTS يمنع تكرار الحساب إن أُعيد التنفيذ.

INSERT INTO `users`
  (`name`, `email`, `password`, `id_number`, `role`, `governorate`, `region`,
   `program_type`, `administrative_title`, `is_active`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT
    'ربيع أبو هولي' AS `name`,
    NULL AS `email`,
    '$2y$12$PrIN7tUFQgh9oEBhHj/K7edRESu7nKRx.ycZHmEcRdCDH5OlArGRK' AS `password`,
    '900000030' AS `id_number`,
    'governorate_manager' AS `role`,
    'الوسطى' AS `governorate`,
    NULL AS `region`,
    NULL AS `program_type`,
    'مسؤول المسائل العلمية' AS `administrative_title`,
    1 AS `is_active`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
  UNION ALL SELECT
    'يوسف بدوي', NULL,
    '$2y$12$ifkUiwslPDIQiWBJJBWEluhGbnBkN/PAoOJIloEdWTk8OsaqR9gJW',
    '900000031', 'governorate_manager', 'غزة', NULL, NULL,
    'مسؤول المسائل العلمية', 1, NOW(), NOW()
  UNION ALL SELECT
    'سعيد الكرد', NULL,
    '$2y$12$Ng2hIzAhHQ/habf6O52pY.mjehi5ymDvYoLTc8wMidOl.WDHUW81y',
    '900000032', 'governorate_manager', 'رفح', NULL, NULL,
    'مسؤول المسائل العلمية', 1, NOW(), NOW()
  UNION ALL SELECT
    'أحمد فسيفس', NULL,
    '$2y$12$z3hT.k588Tg1Z23ClBo.7O5qj3yUHl4dqys.is.K5wmj.i.LGeC5i',
    '900000033', 'central_manager', NULL, NULL, NULL,
    'مسؤول ملف مراقي العلم', 1, NOW(), NOW()
  UNION ALL SELECT
    'مهند السيد', NULL,
    '$2y$12$1GZQ/aohROxm2zhFRhwPTOONvY9Fk7aDfDw0dfItxdt3vfB1PAFUK',
    '900000034', 'central_manager', NULL, NULL, NULL,
    'مسؤول ملف العطاء العلمي', 1, NOW(), NOW()
  UNION ALL SELECT
    'تقي الدين يونس', NULL,
    '$2y$12$p9t2tiC3vgIcvP.ZBPQWnOcB/fKTT4GzLR5836M5GYmKbnCZe9Lwu',
    '900000035', 'central_manager', NULL, NULL, NULL,
    'مسؤول الدائرة العلمية المركزية', 1, NOW(), NOW()
) AS `new_users`
WHERE NOT EXISTS (
  SELECT 1 FROM `users` AS `u` WHERE `u`.`id_number` = `new_users`.`id_number`
);


-- ── 2) ربط المسؤولَين المركزيَّين بصفتيهما (اختياري) ──────────────────
--  الصفات (tags) للفرز والتصفية فقط ولا تمنح أي صلاحية — الرؤية محكومة
--  بالدور وحده. يتطلّب تنفيذ ملف 2026_08_31_scientific_circle_fields.sql
--  أولاً (فهو الذي يُنشئ الصفتين).

INSERT INTO `tag_user` (`tag_id`, `user_id`)
SELECT `t`.`id`, `u`.`id`
FROM `tags` AS `t`
JOIN `users` AS `u` ON `u`.`id_number` = '900000033'
WHERE `t`.`name` = 'مسؤول ملف مراقي العلم'
  AND NOT EXISTS (
    SELECT 1 FROM `tag_user` AS `x`
    WHERE `x`.`tag_id` = `t`.`id` AND `x`.`user_id` = `u`.`id`
  );

INSERT INTO `tag_user` (`tag_id`, `user_id`)
SELECT `t`.`id`, `u`.`id`
FROM `tags` AS `t`
JOIN `users` AS `u` ON `u`.`id_number` = '900000034'
WHERE `t`.`name` = 'مسؤول ملف العطاء العلمي'
  AND NOT EXISTS (
    SELECT 1 FROM `tag_user` AS `x`
    WHERE `x`.`tag_id` = `t`.`id` AND `x`.`user_id` = `u`.`id`
  );

-- تقي الدين يونس ← صفة مزروعة سلفاً (ضمن Tag::SEED_NAMES الأصلية)
INSERT INTO `tag_user` (`tag_id`, `user_id`)
SELECT `t`.`id`, `u`.`id`
FROM `tags` AS `t`
JOIN `users` AS `u` ON `u`.`id_number` = '900000035'
WHERE `t`.`name` = 'مسؤول الدائرة العلمية المركزية'
  AND NOT EXISTS (
    SELECT 1 FROM `tag_user` AS `x`
    WHERE `x`.`tag_id` = `t`.`id` AND `x`.`user_id` = `u`.`id`
  );


-- ── 3) تحقّق بعد التنفيذ ──────────────────────────────────────────────
--  المتوقع: خمسة صفوف، email = NULL، is_active = 1.

-- SELECT `id`, `name`, `id_number`, `role`, `governorate`, `administrative_title`, `is_active`
--   FROM `users` WHERE `id_number` BETWEEN '900000030' AND '900000034' ORDER BY `id_number`;

--  وللتأكّد أن كل مسؤول محافظة سيرى دعاةً فعلاً (يجب ألا يكون العدد صفراً):
-- SELECT `s`.`name` AS `المشرف`, `s`.`governorate` AS `المحافظة`,
--        (SELECT COUNT(*) FROM `users` AS `p`
--          WHERE `p`.`governorate` = `s`.`governorate` AND `p`.`role` = 'preacher') AS `عدد الدعاة`
--   FROM `users` AS `s`
--   WHERE `s`.`role` = 'governorate_manager' AND `s`.`id_number` BETWEEN '900000030' AND '900000032';


-- =====================================================================
--  كلمات المرور المؤقّتة
--
--  ⚠ لا تُكتب كلمات المرور بنصّها الصريح في هذا الملف — فهو مُودَع في
--  المستودع، وما يدخل تاريخ Git يبقى فيه حتى بعد حذفه.
--  البصمات أعلاه bcrypt أحادية الاتجاه ولا تكشف الكلمات.
--
--  الكلمات المؤقّتة سُلّمت للإدارة خارج المستودع. ولتوليد بديل عند الحاجة:
--    php -r "echo password_hash('كلمة-المرور', PASSWORD_BCRYPT, ['cost'=>12]);"
--  ثم: UPDATE `users` SET `password` = '<البصمة>' WHERE `id_number` = '...';
--
--  أرقام الهوية (900000030–900000035) هي اسم المستخدم، وتُستبدل بأرقام
--  الهوية الحقيقية عند توفّرها.
--
--  عند أول دخول سيُطلب منهم التوقيع الإلكتروني على عقد الكفالة قبل
--  الوصول إلى اللوحة (بوابة ContractRoute) — وهذا هو السلوك المعتاد.
-- =====================================================================

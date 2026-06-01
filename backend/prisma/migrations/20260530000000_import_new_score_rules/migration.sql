SET NAMES utf8mb4;
START TRANSACTION;

SET @school_id = COALESCE(
  (SELECT `id` FROM `school` WHERE `code` = 'YYXX' ORDER BY `id` ASC LIMIT 1),
  (SELECT `id` FROM `school` ORDER BY `id` ASC LIMIT 1)
);

SET @semester_id = COALESCE(
  (SELECT `id` FROM `semester` WHERE `school_id` = @school_id AND `is_current` = 1 ORDER BY `id` DESC LIMIT 1),
  (SELECT `id` FROM `semester` WHERE `school_id` = @school_id ORDER BY `id` DESC LIMIT 1)
);

SET @operator_id = COALESCE(
  (SELECT `id` FROM `user` WHERE `school_id` = @school_id AND `username` = 'superadmin_demo' LIMIT 1),
  (SELECT `id` FROM `user` WHERE `school_id` = @school_id AND `username` = 'teacher_demo' LIMIT 1),
  (SELECT `id` FROM `user` WHERE `school_id` = @school_id ORDER BY `id` ASC LIMIT 1)
);

-- 软删除旧规则
UPDATE `score_rule`
SET `status` = 'disabled', `display_enabled` = 0, `admin_enabled` = 0
WHERE `school_id` = @school_id
  AND `semester_id` = @semester_id
  AND (
    `code` LIKE 'DOC_%'
    OR `code` LIKE 'XLS_%'
    OR `code` LIKE 'MORAL_%'
    OR `code` LIKE 'CLASS_%'
  );

INSERT INTO `score_rule` (
  `school_id`,
  `semester_id`,
  `module_type`,
  `subject_code`,
  `scene_code`,
  `code`,
  `name`,
  `score_type`,
  `score_mode`,
  `score_target`,
  `score_value`,
  `dimension`,
  `tag`,
  `sentiment`,
  `ai_summary_text`,
  `description`,
  `allowed_role_codes`,
  `is_high_frequency`,
  `display_enabled`,
  `admin_enabled`,
  `status`,
  `created_by`,
  `updated_by`,
  `created_at`,
  `updated_at`
)
VALUES
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_001_ADD', '课堂表现优秀', 'add', 'fixed', 'student', 2, '课堂学习', '综合表现', 'positive', '课堂学习 / 综合表现 / 正向', '来源工作表：课堂表现；说明：上课专注听讲，受到任课老师当堂表扬。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_002_ADD', '课前三分钟表现优秀', 'add', 'fixed', 'student', 2, '课堂学习', '综合表现', 'positive', '课堂学习 / 综合表现 / 正向', '来源工作表：课堂表现；说明：课前三分钟按时回到教师，准备好相关学习用品。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_003_ADD', '读书声音响亮', 'add', 'fixed', 'student', 2, '课堂学习', '综合表现', 'positive', '课堂学习 / 综合表现 / 正向', '来源工作表：课堂表现；说明：齐读、背诵声音洪亮', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_004_ADD', '上课坐姿端正', 'add', 'fixed', 'student', 2, '行为规范', '习惯养成', 'positive', '行为规范 / 习惯养成 / 正向', '来源工作表：课堂表现；说明：上课时候学生坐姿端正，认真听讲。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_005_ADD', '上课期间桌面收纳整齐', 'add', 'fixed', 'student', 2, '行为规范', '习惯养成', 'positive', '行为规范 / 习惯养成 / 正向', '来源工作表：课堂表现；说明：上课期间学生桌面整洁，无上课无关用品。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_006_ADD', '学生课桌收纳整齐', 'add', 'fixed', 'student', 2, '行为规范', '习惯养成', 'positive', '行为规范 / 习惯养成 / 正向', '来源工作表：课堂表现；说明：各学科学习用品分类整理规范，桌空收纳规范，整洁。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_007_ADD', '学生学科工具单收纳整齐', 'add', 'fixed', 'student', 2, '行为规范', '习惯养成', 'positive', '行为规范 / 习惯养成 / 正向', '来源工作表：课堂表现；说明：各学科工具单分类整理规范，桌空收纳规范，整洁。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_008_ADD', '上课积极回答问题（优秀）', 'add', 'fixed', 'student', 3, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：上课期间积极举手，正确回答问题', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_009_ADD', '上课回答问题（良好）', 'add', 'fixed', 'student', 2, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：上课期间积极举手回答问题，回答不全面。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_010_ADD', '上课回答问题（合格）', 'add', 'fixed', 'student', 1, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：上课期间积极举手回答问题，答案基本不正确。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_011_ADD', '上课主动帮助同学讲解题目', 'add', 'fixed', 'student', 2, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：练习时主动给同学讲解分析知识点、题目', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_012_ADD', '小组讨论优秀', 'add', 'fixed', 'student', 3, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：小组讨论环节合作度高、成果明显', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_013_ADD', '小组讨论良好', 'add', 'fixed', 'student', 2, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：小组讨论合作度较高、成果基本正确', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_014_ADD', '小组讨论合格', 'add', 'fixed', 'student', 1, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：小组认真讨论，但成果不明显', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_015_ADD', '展讲优秀', 'add', 'fixed', 'student', 3, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：上课学生展讲规范，答案正确', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_016_ADD', '展讲合格', 'add', 'fixed', 'student', 2, '课堂学习', '互动表达', 'positive', '课堂学习 / 互动表达 / 正向', '来源工作表：课堂表现；说明：上课学生展讲规范，答案基本正确', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_017_DEDUCT', '学生工具单收纳混乱', 'deduct', 'fixed', 'student', 2, '行为规范', '习惯养成', 'negative', '行为规范 / 习惯养成 / 负向', '来源工作表：课堂表现；说明：各学科工具单不进行分类整理，桌空收纳混乱，有垃圾。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_018_DEDUCT', '课间学生纪律', 'deduct', 'fixed', 'student', 2, '课堂纪律', '自我管理', 'negative', '课堂纪律 / 自我管理 / 负向', '来源工作表：课堂表现；说明：在走廊大声喧哗、奔跑、破坏公物', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_019_DEDUCT', '顶撞教师', 'deduct', 'fixed', 'student', 2, '课堂纪律', '自我管理', 'negative', '课堂纪律 / 自我管理 / 负向', '来源工作表：课堂表现；说明：学生在校内公然顶撞教师，说脏话，辱骂教师', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_020_DEDUCT', '上课迟到', 'deduct', 'fixed', 'student', 2, '课堂纪律', '自我管理', 'negative', '课堂纪律 / 自我管理 / 负向', '来源工作表：课堂表现；说明：上课铃响后未进入教室或在室外逗留（迟到累计3次可另作处理）。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_021_DEDUCT', '扰乱课堂秩序', 'deduct', 'fixed', 'student', 2, '课堂学习', '综合表现', 'negative', '课堂学习 / 综合表现 / 负向', '来源工作表：课堂表现；说明：在课堂上起哄、顶撞老师、擅自走动，导致教学无法正常进行。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_022_DEDUCT', '自习课纪律差', 'deduct', 'fixed', 'student', 2, '课堂纪律', '自我管理', 'negative', '课堂纪律 / 自我管理 / 负向', '来源工作表：课堂表现；说明：自习课期间大声喧哗、随意走动，影响他人学习。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_023_DEDUCT', '无故旷课', 'deduct', 'fixed', 'student', 2, '课堂纪律', '自我管理', 'negative', '课堂纪律 / 自我管理 / 负向', '来源工作表：课堂表现；说明：未请假无故缺课（含正课、自习、晚自习）。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_024_DEDUCT', '学习态度不端正', 'deduct', 'fixed', 'student', 2, '课堂学习', '综合表现', 'negative', '课堂学习 / 综合表现 / 负向', '来源工作表：课堂表现；说明：上课不携带课本、学习工具，拒绝配合老师完成教学任务。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_025_DEDUCT', '上课坐姿不端正', 'deduct', 'fixed', 'student', 2, '行为规范', '习惯养成', 'negative', '行为规范 / 习惯养成 / 负向', '来源工作表：课堂表现；说明：上课期间打瞌睡、手上玩东西、趴在桌面上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'NEW_CLASS_026_DEDUCT', '上课期间桌面收纳混乱', 'deduct', 'fixed', 'student', 2, '行为规范', '习惯养成', 'negative', '行为规范 / 习惯养成 / 负向', '来源工作表：课堂表现；说明：每堂课桌面存在其他学科书籍，水杯，零食等无关用品', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_027_ADD', '抄写优秀', 'add', 'fixed', 'student', 3, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：各学科抄写类作业优秀', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_028_ADD', '抄写良好', 'add', 'fixed', 'student', 2, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：各学科抄写良好', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_029_ADD', '抄写合格', 'add', 'fixed', 'student', 1, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：各学科抄写合格', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_030_ADD', '工具单全对优秀', 'add', 'fixed', 'student', 3, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源工作表：作业；说明：各学科工具单字迹工整，正确率100%。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_031_ADD', '工具单完成良好', 'add', 'fixed', 'student', 2, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源工作表：作业；说明：各学科工具单字迹工整，正确率80%-99%', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_032_ADD', '工具单完成合格', 'add', 'fixed', 'student', 1, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源工作表：作业；说明：各学科工具单字迹工整，正确率60%-79%', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_033_ADD', '学科笔记整理优秀', 'add', 'fixed', 'student', 3, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源工作表：作业；说明：各学科考点汇总/笔记汇总字迹工整、规范、优秀', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_034_ADD', '学科笔记整理良好', 'add', 'fixed', 'student', 2, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源工作表：作业；说明：各学科考点汇总/笔记汇总字迹基本工整、规范、良好', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_035_ADD', '学科笔记整理合格', 'add', 'fixed', 'student', 1, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源工作表：作业；说明：各学科考点汇总/笔记汇总字迹基本工整、格式基本规范、合格', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_036_ADD', '每日计算全对', 'add', 'fixed', 'student', 2, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源工作表：作业；说明：数学、物理每日计算全对', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_037_ADD', '每日计算合格', 'add', 'fixed', 'student', 1, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源工作表：作业；说明：数学、物理每日计算正确率达到50%以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_038_ADD', '语文作文优秀', 'add', 'fixed', 'student', 5, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：语文作文34分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_039_ADD', '语文作文良好', 'add', 'fixed', 'student', 3, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：语文作文31-33分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_040_ADD', '语文作文合格', 'add', 'fixed', 'student', 2, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：语文作文28-30分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_041_ADD', '英语作文优秀', 'add', 'fixed', 'student', 5, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：英语作文9-10分', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_042_ADD', '英语作文良好', 'add', 'fixed', 'student', 3, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：英语作文7-8分', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_043_ADD', '英语作文合格', 'add', 'fixed', 'student', 2, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：英语作文5-6分', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_044_ADD', '练字优秀', 'add', 'fixed', 'student', 2, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：练字字迹清秀、工整', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_045_ADD', '练字合格', 'add', 'fixed', 'student', 1, '作业管理', '书写规范', 'positive', '作业管理 / 书写规范 / 正向', '来源工作表：作业；说明：练字字迹基本清秀、工整', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_046_ADD', '主动做题提升且全对', 'add', 'fixed', 'student', 3, '作业管理', '自主学习', 'positive', '作业管理 / 自主学习 / 正向', '来源工作表：作业；说明：学生根据自自己需要主动做题提升成绩', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_047_ADD', '主动做题提升', 'add', 'fixed', 'student', 2, '作业管理', '自主学习', 'positive', '作业管理 / 自主学习 / 正向', '来源工作表：作业；说明：学生根据自自己需要主动做题提升成绩', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_048_ADD', '提前完成作业且优秀', 'add', 'fixed', 'student', 3, '作业管理', '自主学习', 'positive', '作业管理 / 自主学习 / 正向', '来源工作表：作业；说明：学生提前完成各学科作业且优秀', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_049_ADD', '提前完成周作业且良好', 'add', 'fixed', 'student', 2, '作业管理', '自主学习', 'positive', '作业管理 / 自主学习 / 正向', '来源工作表：作业；说明：学生提前完成各学科作业且良好', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_050_ADD', '提前完成周作业合格', 'add', 'fixed', 'student', 1, '作业管理', '自主学习', 'positive', '作业管理 / 自主学习 / 正向', '来源工作表：作业；说明：学生提前完成各学科作业合格', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_051_DEDUCT', '抄写未完成', 'deduct', 'fixed', 'student', 3, '作业管理', '书写规范', 'negative', '作业管理 / 书写规范 / 负向', '来源工作表：作业；说明：各学科抄写类作业未完成', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_052_DEDUCT', '抄写完成但不合格', 'deduct', 'fixed', 'student', 2, '作业管理', '书写规范', 'negative', '作业管理 / 书写规范 / 负向', '来源工作表：作业；说明：各学科抄写不合格', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_053_DEDUCT', '工具单未完成', 'deduct', 'fixed', 'student', 3, '作业管理', '任务完成', 'negative', '作业管理 / 任务完成 / 负向', '来源工作表：作业；说明：各学科工具单未完成', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_054_DEDUCT', '工具单完成但不合格', 'deduct', 'fixed', 'student', 2, '作业管理', '任务完成', 'negative', '作业管理 / 任务完成 / 负向', '来源工作表：作业；说明：各学科工具单完成但不合格', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_055_DEDUCT', '工具单完成合格', 'deduct', 'fixed', 'student', 3, '作业管理', '任务完成', 'negative', '作业管理 / 任务完成 / 负向', '来源工作表：作业；说明：各学科工具单字迹工整，正确率60%-79%', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_056_DEDUCT', '学科笔记整理未完成', 'deduct', 'fixed', 'student', 3, '作业管理', '任务完成', 'negative', '作业管理 / 任务完成 / 负向', '来源工作表：作业；说明：各学科考点汇总/笔记汇总未完成', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_057_DEDUCT', '学科笔记整理但不合格', 'deduct', 'fixed', 'student', 2, '作业管理', '任务完成', 'negative', '作业管理 / 任务完成 / 负向', '来源工作表：作业；说明：各学科考点汇总/笔记汇总但字迹混乱', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_058_DEDUCT', '每日计算未完成', 'deduct', 'fixed', 'student', 3, '作业管理', '任务完成', 'negative', '作业管理 / 任务完成 / 负向', '来源工作表：作业；说明：数学、物理每日计算不按时完成', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_059_DEDUCT', '每日计算完成但错误率高', 'deduct', 'fixed', 'student', 2, '作业管理', '任务完成', 'negative', '作业管理 / 任务完成 / 负向', '来源工作表：作业；说明：数学、物理每日计算正确率低', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_060_DEDUCT', '作文未完成', 'deduct', 'fixed', 'student', 3, '作业管理', '书写规范', 'negative', '作业管理 / 书写规范 / 负向', '来源工作表：作业；说明：语文作文未完成', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_061_DEDUCT', '作文完成但态度敷衍', 'deduct', 'fixed', 'student', 2, '作业管理', '书写规范', 'negative', '作业管理 / 书写规范 / 负向', '来源工作表：作业；说明：语文作文完成但态度敷衍', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_062_DEDUCT', '不完成练字', 'deduct', 'fixed', 'student', 2, '作业管理', '书写规范', 'negative', '作业管理 / 书写规范 / 负向', '来源工作表：作业；说明：不完成语文、英语练字', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'NEW_HW_063_DEDUCT', '练字完成但不合格', 'deduct', 'fixed', 'student', 1, '作业管理', '书写规范', 'negative', '作业管理 / 书写规范 / 负向', '来源工作表：作业；说明：完成语文、英语练字、但是书写糟糕', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_064_ADD', '单元检测优秀', 'add', 'fixed', 'student', 3, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：每个单元单元过关检测90分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_065_ADD', '单元检测良好', 'add', 'fixed', 'student', 2, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：每个单元单元过关检测80-89分', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_066_ADD', '单元检测合格', 'add', 'fixed', 'student', 1, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：每个单元单元过关检测60-79分', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_067_ADD', '周清满分', 'add', 'fixed', 'student', 4, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：每周各学科周清满分', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_068_ADD', '周清优秀', 'add', 'fixed', 'student', 3, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：每周各学科周清正确率90%以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_069_ADD', '周清良好', 'add', 'fixed', 'student', 2, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：每周各学科周清正确率80-89%以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_070_ADD', '周清合格', 'add', 'fixed', 'student', 1, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：每周各学科周清正确率60-70%以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_071_ADD', '月阶段评价满分', 'add', 'fixed', 'student', 10, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：各学科有满分的科目及可以加分', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_072_ADD', '月阶段评价A级别', 'add', 'fixed', 'student', 5, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：月阶段评价90分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_073_ADD', '月阶段评价B级别', 'add', 'fixed', 'student', 3, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：月阶段评价80-89分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_074_ADD', '月阶段评价C级别', 'add', 'fixed', 'student', 2, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：月阶段评价60-79分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_075_ADD', '期末阶段质量监测满分', 'add', 'fixed', 'student', 10, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：各学科有满分的科目及可以加分', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_076_ADD', '期末阶段质量监测A级', 'add', 'fixed', 'student', 5, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：月阶段评价90分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_077_ADD', '期末阶段质量监测A级', 'add', 'fixed', 'student', 3, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：月阶段评价80-89分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_078_ADD', '期末阶段质量监测满分', 'add', 'fixed', 'student', 2, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：月阶段评价60-79分以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_079_ADD', '周清进步之星', 'add', 'fixed', 'student', 3, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：每周周清进步前五名', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_080_ADD', '阶段评价进步之星', 'add', 'fixed', 'student', 5, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：阶段评价进步之星前五名', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'NEW_EXAM_081_ADD', '期末阶段质量监测进步之星', 'add', 'fixed', 'student', 5, '学业成绩', '测评表现', 'positive', '学业成绩 / 测评表现 / 正向', '来源工作表：周清和阶段评价；说明：阶段评价进步之星前五名', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_082_ADD', '国家级别竞赛第一名', 'add', 'fixed', 'student', 20, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：学生参加各类国家级别竞赛并活动相应奖项', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_083_ADD', '国家级别竞赛第二名', 'add', 'fixed', 'student', 15, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_084_ADD', '国家级别竞赛第三名', 'add', 'fixed', 'student', 10, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_085_ADD', '国家级别竞赛优秀奖', 'add', 'fixed', 'student', 5, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_086_ADD', '省级竞赛第一名', 'add', 'fixed', 'student', 15, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：学生参加各类省级活动并获得相应奖项', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_087_ADD', '省级竞赛第二名', 'add', 'fixed', 'student', 12, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_088_ADD', '省级竞赛第三名', 'add', 'fixed', 'student', 9, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_089_ADD', '省级竞赛优秀奖', 'add', 'fixed', 'student', 6, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_090_ADD', '州/市级竞赛第一名', 'add', 'fixed', 'student', 10, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：学生参加各类州、市竞赛并获得奖项', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_091_ADD', '州/市级竞赛第二名', 'add', 'fixed', 'student', 8, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_092_ADD', '州/市级竞赛第三名', 'add', 'fixed', 'student', 6, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_093_ADD', '州/市级竞赛优秀奖', 'add', 'fixed', 'student', 4, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_094_ADD', '校级竞赛第一名', 'add', 'fixed', 'student', 8, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：学生参加各类校级活动并获得奖项', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_095_ADD', '校级竞赛第二名', 'add', 'fixed', 'student', 6, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_096_ADD', '校级竞赛第三名', 'add', 'fixed', 'student', 4, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'NEW_COMP_097_ADD', '校级竞赛优秀奖', 'add', 'fixed', 'student', 3, '学科活动', '活动参与', 'positive', '学科活动 / 活动参与 / 正向', '来源工作表：竞赛 ；说明：', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_098_ADD', '语文、英语早读表现优异', 'add', 'fixed', 'student', 1, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：早读声音洪亮、态度端正。', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_099_ADD', '语文、英语早读默写全对', 'add', 'fixed', 'student', 3, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：正确率百分百', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_100_ADD', '语文、英语早读默写优秀', 'add', 'fixed', 'student', 2, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：正确率90%', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_101_ADD', '语文、英语早读默写合格', 'add', 'fixed', 'student', 1, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：正确率70-89%', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_102_ADD', '文言文背诵', 'add', 'fixed', 'student', 4, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：课本中文言文等长篇课文背诵', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_103_ADD', '古诗文背诵', 'add', 'fixed', 'student', 3, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：课本中古诗词背诵', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_104_ADD', '英语课文背诵', 'add', 'fixed', 'student', 3, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：课本中短篇的背诵', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_105_ADD', '英语对话背诵', 'add', 'fixed', 'student', 2, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：课本中各类对话的背诵', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_106_ADD', '整单元知识点背诵', 'add', 'fixed', 'student', 5, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：各学科每个单元的知识进行背诵', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_107_ADD', '课堂知识背诵', 'add', 'fixed', 'student', 3, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：各学科当堂背诵', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_108_ADD', '课堂知识背诵', 'add', 'fixed', 'student', 2, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：各学科当堂背诵', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_109_ADD', '听、默写全对', 'add', 'fixed', 'student', 3, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：各学科日常听写全对', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_110_ADD', '听、默写优秀', 'add', 'fixed', 'student', 2, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：各学科日常听写正确率90%以上', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'dictation', 'NEW_DICT_111_ADD', '听默写合格', 'add', 'fixed', 'student', 1, '背诵与早读', '语言积累', 'positive', '背诵与早读 / 语言积累 / 正向', '来源工作表：背诵及听默写；说明：各学科日常听写正确率70-89%', NULL, 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3));

COMMIT;

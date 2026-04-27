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

DELETE FROM `score_rule`
WHERE `school_id` = @school_id
  AND `semester_id` = @semester_id
  AND `code` IN (
    'DOC_GEN_CLASSROOM_EXCELLENT',
    'DOC_GEN_HOMEWORK_EXCELLENT',
    'DOC_GEN_EXAM_PROGRESS',
    'DOC_GEN_SUBJECT_COMPETITION_LEVEL1',
    'DOC_GEN_SUBJECT_COMPETITION_LEVEL2',
    'DOC_GEN_SUBJECT_COMPETITION_LEVEL3',
    'DOC_GEN_EXCELLENT_STUDY_GROUP',
    'DOC_GEN_MORNING_READING_GOOD',
    'DOC_GEN_SIT_PROPER',
    'DOC_GEN_DESK_TIDY',
    'DOC_GEN_LATE_FOR_CLASS',
    'DOC_GEN_CLASSROOM_DISCIPLINE',
    'DOC_GEN_HOMEWORK_LATE_MISSING',
    'DOC_GEN_HOMEWORK_POOR_QUALITY',
    'DOC_GEN_EXAM_CHEATING',
    'DOC_GEN_DISTURB_CLASS',
    'DOC_GEN_SELF_STUDY_BAD',
    'DOC_GEN_TRUANCY',
    'DOC_GEN_ATTITUDE_POOR',
    'DOC_GEN_SIT_IMPROPER',
    'DOC_SUB_MATH_WEEKLY_PROGRESS',
    'DOC_SUB_ENGLISH_DICTATION_FULL',
    'DOC_SUB_CHINESE_RECITATION_ON_TIME',
    'DOC_SUB_PHYSICS_QA_ACTIVE',
    'DOC_SUB_CHEMISTRY_EXPERIMENT_GOOD',
    'DOC_SUB_PE_COMPETITION_LEVEL1',
    'DOC_SUB_PE_COMPETITION_LEVEL2',
    'DOC_SUB_PE_COMPETITION_LEVEL3'
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
  `score_value`,
  `dimension`,
  `tag`,
  `sentiment`,
  `ai_summary_text`,
  `description`,
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
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'DOC_GEN_CLASSROOM_EXCELLENT', '课堂表现优秀', 'add', 'fixed', 2, '课堂学习', '专注投入', 'positive', '课堂学习 / 专注投入 / 正向', '来源：积分规则基线文档，通用教务正向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'DOC_GEN_HOMEWORK_EXCELLENT', '作业优秀', 'add', 'fixed', 2, '作业管理', '任务完成', 'positive', '作业管理 / 任务完成 / 正向', '来源：积分规则基线文档，通用教务正向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'DOC_GEN_EXAM_PROGRESS', '考试进步显著', 'add', 'fixed', 5, '学业成绩', '成长进步', 'positive', '学业成绩 / 成长进步 / 正向', '来源：积分规则基线文档，通用教务正向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'DOC_GEN_SUBJECT_COMPETITION_LEVEL1', '学科竞赛获奖（一级）', 'add', 'fixed', 5, '学科活动', '竞赛获奖', 'positive', '学科活动 / 竞赛获奖 / 正向', '原始文档为区间分值 +5~+10，按第一阶段建议拆分为固定档位。', 0, 0, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'DOC_GEN_SUBJECT_COMPETITION_LEVEL2', '学科竞赛获奖（二级）', 'add', 'fixed', 8, '学科活动', '竞赛获奖', 'positive', '学科活动 / 竞赛获奖 / 正向', '原始文档为区间分值 +5~+10，按第一阶段建议拆分为固定档位。', 0, 0, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'competition', 'DOC_GEN_SUBJECT_COMPETITION_LEVEL3', '学科竞赛获奖（三级）', 'add', 'fixed', 10, '学科活动', '竞赛获奖', 'positive', '学科活动 / 竞赛获奖 / 正向', '原始文档为区间分值 +5~+10，按第一阶段建议拆分为固定档位。', 0, 0, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'group', 'DOC_GEN_EXCELLENT_STUDY_GROUP', '优秀学习小组', 'add', 'fixed', 3, '合作表现', '小组协作', 'positive', '合作表现 / 小组协作 / 正向', '来源：积分规则基线文档，通用教务正向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'reading', 'DOC_GEN_MORNING_READING_GOOD', '早读认真', 'add', 'fixed', 1, '早读表现', '专注投入', 'positive', '早读表现 / 专注投入 / 正向', '来源：积分规则基线文档，通用教务正向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'DOC_GEN_SIT_PROPER', '上课坐姿端正', 'add', 'fixed', 2, '课堂纪律', '行为规范', 'positive', '课堂纪律 / 行为规范 / 正向', '来源：积分规则基线文档，通用教务正向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'DOC_GEN_DESK_TIDY', '上课期间桌面收纳整齐', 'add', 'fixed', 2, '课堂纪律', '环境管理', 'positive', '课堂纪律 / 环境管理 / 正向', '来源：积分规则基线文档，通用教务正向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'attendance', 'DOC_GEN_LATE_FOR_CLASS', '上课迟到', 'deduct', 'fixed', 2, '出勤管理', '时间纪律', 'negative', '出勤管理 / 时间纪律 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'DOC_GEN_CLASSROOM_DISCIPLINE', '课堂违纪', 'deduct', 'fixed', 2, '课堂纪律', '自我管理', 'negative', '课堂纪律 / 自我管理 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'DOC_GEN_HOMEWORK_LATE_MISSING', '缺交/迟交作业', 'deduct', 'fixed', 2, '作业管理', '任务完成', 'negative', '作业管理 / 任务完成 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'homework', 'DOC_GEN_HOMEWORK_POOR_QUALITY', '作业质量差', 'deduct', 'fixed', 2, '作业管理', '作业质量', 'negative', '作业管理 / 作业质量 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'exam', 'DOC_GEN_EXAM_CHEATING', '考试作弊', 'deduct', 'fixed', 10, '学业诚信', '考试纪律', 'negative', '学业诚信 / 考试纪律 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 0, 0, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'DOC_GEN_DISTURB_CLASS', '扰乱课堂秩序', 'deduct', 'fixed', 3, '课堂纪律', '秩序维护', 'negative', '课堂纪律 / 秩序维护 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'self_study', 'DOC_GEN_SELF_STUDY_BAD', '自习课纪律差', 'deduct', 'fixed', 2, '自习纪律', '自我管理', 'negative', '自习纪律 / 自我管理 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'attendance', 'DOC_GEN_TRUANCY', '无故旷课', 'deduct', 'fixed', 5, '出勤管理', '出勤异常', 'negative', '出勤管理 / 出勤异常 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 0, 0, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'DOC_GEN_ATTITUDE_POOR', '学习态度不端正', 'deduct', 'fixed', 2, '学习态度', '态度问题', 'negative', '学习态度 / 态度问题 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'general', NULL, 'classroom', 'DOC_GEN_SIT_IMPROPER', '上课坐姿不端正', 'deduct', 'fixed', 2, '课堂纪律', '行为规范', 'negative', '课堂纪律 / 行为规范 / 负向', '来源：积分规则基线文档，通用教务负向规则。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'subject', 'math', 'exam', 'DOC_SUB_MATH_WEEKLY_PROGRESS', '数学周测进步', 'add', 'fixed', 3, '学业成绩', '成长进步', 'positive', '数学学科 / 周测进步 / 正向', '来源：规则基线文档中“数学周测进步”示例。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'subject', 'english', 'dictation', 'DOC_SUB_ENGLISH_DICTATION_FULL', '英语听默写全对', 'add', 'fixed', 2, '背诵与早读', '听默写', 'positive', '英语学科 / 听默写 / 正向', '来源：规则基线文档中“英语听默写全对”示例。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'subject', 'chinese', 'recitation', 'DOC_SUB_CHINESE_RECITATION_ON_TIME', '语文背诵按时完成', 'add', 'fixed', 2, '背诵与早读', '背书完成', 'positive', '语文学科 / 背书完成 / 正向', '依据文档中“背诵与早读：按时完成、背书”高频场景整理。', 1, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'subject', 'physics', 'classroom', 'DOC_SUB_PHYSICS_QA_ACTIVE', '物理答疑积极', 'add', 'fixed', 2, '课堂表现', '答疑互动', 'positive', '物理学科 / 答疑互动 / 正向', '依据文档中“课堂表现：答疑”高频场景整理。', 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'subject', 'chemistry', 'activity', 'DOC_SUB_CHEMISTRY_EXPERIMENT_GOOD', '化学实验展示优秀', 'add', 'fixed', 3, '学科活动', '技能展示', 'positive', '化学学科 / 技能展示 / 正向', '依据文档中“学科活动：技能展示”高频场景整理。', 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'subject', 'pe', 'competition', 'DOC_SUB_PE_COMPETITION_LEVEL1', '体育比赛获奖（一级）', 'add', 'fixed', 5, '学科活动', '竞赛获奖', 'positive', '体育学科 / 竞赛获奖 / 正向', '依据文档中“体育比赛获奖”场景，并按固定档位拆分。', 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'subject', 'pe', 'competition', 'DOC_SUB_PE_COMPETITION_LEVEL2', '体育比赛获奖（二级）', 'add', 'fixed', 8, '学科活动', '竞赛获奖', 'positive', '体育学科 / 竞赛获奖 / 正向', '依据文档中“体育比赛获奖”场景，并按固定档位拆分。', 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3)),
  (@school_id, @semester_id, 'subject', 'pe', 'competition', 'DOC_SUB_PE_COMPETITION_LEVEL3', '体育比赛获奖（三级）', 'add', 'fixed', 10, '学科活动', '竞赛获奖', 'positive', '体育学科 / 竞赛获奖 / 正向', '依据文档中“体育比赛获奖”场景，并按固定档位拆分。', 0, 1, 1, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3));

COMMIT;

-- 确保班级评价与学生管理规则保持启用。
-- import_new_score_rules 迁移在导入 NEW_* 学生规则时误将 MORAL_* / CLASS_* 一并软禁用，
-- 导致「班级评价」无规则、「学生评价」缺少「学生管理」分类。
UPDATE `score_rule`
SET `admin_enabled` = 1,
    `display_enabled` = 1,
    `status` = 'enabled',
    `is_high_frequency` = 1
WHERE `score_target` = 'class';

UPDATE `score_rule`
SET `admin_enabled` = 1,
    `display_enabled` = 1,
    `status` = 'enabled',
    `allowed_role_codes` = NULL,
    `subject_code` = NULL
WHERE `code` LIKE 'MORAL_%';

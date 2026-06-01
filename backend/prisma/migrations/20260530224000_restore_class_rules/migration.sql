-- 恢复之前可能被误禁用的班级评价规则
UPDATE `score_rule` 
SET `admin_enabled` = 1, `display_enabled` = 1, `status` = 'enabled', `is_high_frequency` = 1 
WHERE `score_target` = 'class';

-- 恢复“学生管理”（MORAL）分类规则，并使其对所有任课老师可见（不区分角色和科目）
UPDATE `score_rule` 
SET `admin_enabled` = 1, `display_enabled` = 1, `status` = 'enabled', `allowed_role_codes` = NULL, `subject_code` = NULL 
WHERE `code` LIKE 'MORAL_%';

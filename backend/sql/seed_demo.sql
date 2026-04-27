SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

INSERT INTO `school` (`id`, `code`, `name`, `motto`, `status`, `created_at`, `updated_at`)
VALUES (1, 'YYXX', '育英学校', '育英启智 星宠同行', 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `motto` = VALUES(`motto`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

INSERT INTO `semester` (`id`, `school_id`, `name`, `start_date`, `end_date`, `is_current`, `status`, `created_at`, `updated_at`)
VALUES (1, 1, '2026春季学期', '2026-02-01', '2026-07-15', 1, 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `school_id` = VALUES(`school_id`),
  `name` = VALUES(`name`),
  `start_date` = VALUES(`start_date`),
  `end_date` = VALUES(`end_date`),
  `is_current` = VALUES(`is_current`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

INSERT INTO `role` (`id`, `school_id`, `code`, `name`, `is_system`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'super_admin', '系统管理员', 1, NOW(3), NOW(3)),
  (2, 1, 'school_admin', '学校管理员', 1, NOW(3), NOW(3)),
  (3, 1, 'moral_admin', '德育管理员', 1, NOW(3), NOW(3)),
  (4, 1, 'homeroom_teacher', '班主任', 1, NOW(3), NOW(3)),
  (5, 1, 'subject_teacher', '任课教师', 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `school_id` = VALUES(`school_id`),
  `code` = VALUES(`code`),
  `name` = VALUES(`name`),
  `is_system` = VALUES(`is_system`),
  `updated_at` = NOW(3);

INSERT INTO `user` (`id`, `school_id`, `role_id`, `username`, `password_hash`, `name`, `status`, `created_at`, `updated_at`)
VALUES
  (1, 1, 4, 'teacher_demo', '$2a$10$r4uaaF7Q/pAcZAng.07HR.jEDspPZUigvr46rIEDAdGsscNMEumbK', '演示班主任', 'enabled', NOW(3), NOW(3)),
  (2, 1, 5, 'subject_demo', '$2a$10$r4uaaF7Q/pAcZAng.07HR.jEDspPZUigvr46rIEDAdGsscNMEumbK', '演示任课教师', 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `school_id` = VALUES(`school_id`),
  `role_id` = VALUES(`role_id`),
  `password_hash` = VALUES(`password_hash`),
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

INSERT INTO `class` (`id`, `school_id`, `semester_id`, `code`, `grade_code`, `grade_name`, `name`, `homeroom_teacher_id`, `target_score`, `display_status`, `status`, `created_at`, `updated_at`)
VALUES (1, 1, 1, 'CLASS-0101', 'G1', '一年级', '一(1)班', 1, 100, 'enabled', 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `school_id` = VALUES(`school_id`),
  `semester_id` = VALUES(`semester_id`),
  `code` = VALUES(`code`),
  `grade_code` = VALUES(`grade_code`),
  `grade_name` = VALUES(`grade_name`),
  `name` = VALUES(`name`),
  `homeroom_teacher_id` = VALUES(`homeroom_teacher_id`),
  `target_score` = VALUES(`target_score`),
  `display_status` = VALUES(`display_status`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

INSERT INTO `user_scope` (`id`, `user_id`, `scope_type`, `class_id`, `created_at`)
VALUES
  (1, 1, 'class_scope', 1, NOW(3)),
  (2, 2, 'class_scope', 1, NOW(3))
ON DUPLICATE KEY UPDATE
  `user_id` = VALUES(`user_id`),
  `scope_type` = VALUES(`scope_type`),
  `class_id` = VALUES(`class_id`);

INSERT INTO `student` (`id`, `school_id`, `class_id`, `student_no`, `name`, `status`, `created_at`, `updated_at`)
VALUES
  (1, 1, 1, '20260101', '李星星', 'enabled', NOW(3), NOW(3)),
  (2, 1, 1, '20260102', '王宠宠', 'enabled', NOW(3), NOW(3)),
  (3, 1, 1, '20260103', '陈晨光', 'enabled', NOW(3), NOW(3)),
  (4, 1, 1, '20260104', '赵小满', 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `school_id` = VALUES(`school_id`),
  `class_id` = VALUES(`class_id`),
  `student_no` = VALUES(`student_no`),
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

INSERT INTO `student_profile` (`id`, `student_id`, `class_id`, `current_score`, `total_score`, `current_pet_level`, `updated_at`)
VALUES
  (1, 1, 1, 0, 0, 1, NOW(3)),
  (2, 2, 1, 0, 0, 1, NOW(3)),
  (3, 3, 1, 0, 0, 1, NOW(3)),
  (4, 4, 1, 0, 0, 1, NOW(3))
ON DUPLICATE KEY UPDATE
  `class_id` = VALUES(`class_id`),
  `updated_at` = NOW(3);

INSERT INTO `class_group` (`id`, `class_id`, `group_no`, `name`, `status`, `created_at`, `updated_at`)
VALUES
  (1, 1, 1, '启明星组', 'enabled', NOW(3), NOW(3)),
  (2, 1, 2, '北斗星组', 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `class_id` = VALUES(`class_id`),
  `group_no` = VALUES(`group_no`),
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

INSERT INTO `student_group_rel` (`id`, `student_id`, `class_group_id`, `created_at`, `updated_at`)
VALUES
  (1, 1, 1, NOW(3), NOW(3)),
  (2, 2, 1, NOW(3), NOW(3)),
  (3, 3, 2, NOW(3), NOW(3)),
  (4, 4, 2, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `class_group_id` = VALUES(`class_group_id`),
  `updated_at` = NOW(3);

INSERT INTO `score_rule` (
  `id`, `school_id`, `semester_id`, `module_type`, `scene_code`, `code`, `name`, `score_type`, `score_mode`,
  `score_value`, `dimension`, `tag`, `sentiment`, `is_high_frequency`, `display_enabled`, `admin_enabled`,
  `status`, `created_by`, `updated_by`, `created_at`, `updated_at`
)
VALUES
  (1, 1, 1, 'general', 'classroom', 'CLASS_POSITIVE_SPEAK', '课堂积极发言', 'add', 'fixed', 2, '课堂表现', '积极发言', 'positive', 1, 1, 1, 'enabled', 1, 1, NOW(3), NOW(3)),
  (2, 1, 1, 'general', 'classroom', 'CLASS_DISCIPLINE_REMIND', '课堂纪律提醒', 'deduct', 'fixed', 1, '课堂表现', '课堂纪律', 'negative', 1, 1, 1, 'enabled', 1, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `score_type` = VALUES(`score_type`),
  `score_value` = VALUES(`score_value`),
  `dimension` = VALUES(`dimension`),
  `tag` = VALUES(`tag`),
  `sentiment` = VALUES(`sentiment`),
  `is_high_frequency` = VALUES(`is_high_frequency`),
  `display_enabled` = VALUES(`display_enabled`),
  `admin_enabled` = VALUES(`admin_enabled`),
  `status` = VALUES(`status`),
  `updated_by` = VALUES(`updated_by`),
  `updated_at` = NOW(3);

INSERT INTO `reward` (`id`, `school_id`, `code`, `name`, `category`, `score_cost`, `stock_qty`, `is_infinite_stock`, `status`, `created_at`, `updated_at`)
VALUES (1, 1, 'REWARD-STATIONERY', '文具礼包', 'stationery', 20, 50, 0, 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `score_cost` = VALUES(`score_cost`),
  `stock_qty` = VALUES(`stock_qty`),
  `is_infinite_stock` = VALUES(`is_infinite_stock`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

INSERT INTO `display_config` (`id`, `school_id`, `class_id`, `title`, `subtitle`, `allow_skip_animation`, `default_mode`, `created_at`, `updated_at`)
VALUES (1, 1, 1, '育英星宠', '欢迎进入一(1)班', 1, 'class-home', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `subtitle` = VALUES(`subtitle`),
  `allow_skip_animation` = VALUES(`allow_skip_animation`),
  `default_mode` = VALUES(`default_mode`),
  `updated_at` = NOW(3);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

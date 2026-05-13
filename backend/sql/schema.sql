-- CreateTable
CREATE TABLE `school` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `english_name` VARCHAR(255) NULL,
    `motto` VARCHAR(255) NULL,
    `logo_url` VARCHAR(255) NULL,
    `emblem_url` VARCHAR(255) NULL,
    `phone` VARCHAR(32) NULL,
    `address` VARCHAR(255) NULL,
    `pet_growth_thresholds` JSON NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semester` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_current` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `semester_school_id_idx`(`school_id`),
    INDEX `semester_school_id_is_current_idx`(`school_id`, `is_current`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `role_school_id_idx`(`school_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(128) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `module` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permission_rel` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `role_id` BIGINT NOT NULL,
    `permission_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `role_permission_rel_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `email` VARCHAR(128) NULL,
    `duty_tags` JSON NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `user_username_key`(`username`),
    INDEX `user_school_id_idx`(`school_id`),
    INDEX `user_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_scope` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `scope_type` ENUM('school', 'grade', 'class_scope', 'subject_class') NOT NULL,
    `grade_code` VARCHAR(32) NULL,
    `class_id` BIGINT NULL,
    `subject_code` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_scope_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `grade_code` VARCHAR(32) NOT NULL,
    `grade_name` VARCHAR(32) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `homeroom_teacher_id` BIGINT NULL,
    `slogan` VARCHAR(255) NULL,
    `target_score` INTEGER NULL,
    `display_status` VARCHAR(32) NULL,
    `sort_order` INTEGER NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `class_school_id_semester_id_idx`(`school_id`, `semester_id`),
    INDEX `class_grade_code_idx`(`grade_code`),
    INDEX `class_homeroom_teacher_id_idx`(`homeroom_teacher_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `student_no` VARCHAR(64) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `gender` VARCHAR(16) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `joined_at` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `student_school_id_idx`(`school_id`),
    INDEX `student_class_id_idx`(`class_id`),
    UNIQUE INDEX `student_class_id_student_no_key`(`class_id`, `student_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_profile` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `current_score` INTEGER NOT NULL DEFAULT 0,
    `total_score` INTEGER NOT NULL DEFAULT 0,
    `current_pet_level` INTEGER NOT NULL DEFAULT 1,
    `medals_count` INTEGER NOT NULL DEFAULT 0,
    `honors_count` INTEGER NOT NULL DEFAULT 0,
    `rewards_count` INTEGER NOT NULL DEFAULT 0,
    `positive_count_7d` INTEGER NOT NULL DEFAULT 0,
    `negative_count_7d` INTEGER NOT NULL DEFAULT 0,
    `last_score_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_profile_student_id_key`(`student_id`),
    INDEX `student_profile_class_id_idx`(`class_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_group` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `class_id` BIGINT NOT NULL,
    `group_no` INTEGER NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `sort_order` INTEGER NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `class_group_class_id_group_no_key`(`class_id`, `group_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_group_rel` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT NOT NULL,
    `class_group_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_group_rel_student_id_key`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `score_rule` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `module_type` ENUM('general', 'subject') NOT NULL,
    `subject_code` VARCHAR(32) NULL,
    `scene_code` VARCHAR(32) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `score_type` ENUM('add', 'deduct') NOT NULL,
    `score_mode` ENUM('fixed') NOT NULL DEFAULT 'fixed',
    `score_target` ENUM('student', 'class') NOT NULL DEFAULT 'student',
    `score_value` INTEGER NOT NULL,
    `min_score` INTEGER NULL,
    `max_score` INTEGER NULL,
    `dimension` VARCHAR(64) NULL,
    `tag` VARCHAR(64) NULL,
    `sentiment` ENUM('positive', 'negative') NOT NULL,
    `weight` DECIMAL(6, 2) NULL,
    `ai_summary_text` VARCHAR(255) NULL,
    `description` VARCHAR(500) NULL,
    `is_high_frequency` BOOLEAN NOT NULL DEFAULT false,
    `display_enabled` BOOLEAN NOT NULL DEFAULT false,
    `admin_enabled` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_by` BIGINT NULL,
    `updated_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `score_rule_school_id_semester_id_idx`(`school_id`, `semester_id`),
    INDEX `score_rule_module_type_subject_code_scene_code_idx`(`module_type`, `subject_code`, `scene_code`),
    INDEX `score_rule_score_target_idx`(`score_target`),
    INDEX `score_rule_display_enabled_idx`(`display_enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `score_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `student_id` BIGINT NOT NULL,
    `class_group_id` BIGINT NULL,
    `rule_id` BIGINT NOT NULL,
    `subject_code` VARCHAR(32) NULL,
    `scene_code` VARCHAR(32) NULL,
    `dimension` VARCHAR(64) NULL,
    `tag` VARCHAR(64) NULL,
    `sentiment` ENUM('positive', 'negative') NOT NULL,
    `score_delta` INTEGER NOT NULL,
    `remark` VARCHAR(255) NULL,
    `source_terminal` ENUM('admin', 'display') NOT NULL,
    `source_role` VARCHAR(32) NULL,
    `operator_id` BIGINT NOT NULL,
    `operator_name` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `score_record_student_id_created_at_idx`(`student_id`, `created_at`),
    INDEX `score_record_class_id_created_at_idx`(`class_id`, `created_at`),
    INDEX `score_record_rule_id_idx`(`rule_id`),
    INDEX `score_record_subject_code_scene_code_idx`(`subject_code`, `scene_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `score_record_batch` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `action_type` VARCHAR(16) NOT NULL,
    `rule_id` BIGINT NOT NULL,
    `score_delta` INTEGER NOT NULL,
    `remark` VARCHAR(255) NULL,
    `source_terminal` ENUM('admin', 'display') NOT NULL,
    `operator_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `score_record_batch_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT NOT NULL,
    `score_record_id` BIGINT NOT NULL,
    `student_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_score_profile` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `current_score` INTEGER NOT NULL DEFAULT 0,
    `total_score` INTEGER NOT NULL DEFAULT 0,
    `positive_count_7d` INTEGER NOT NULL DEFAULT 0,
    `negative_count_7d` INTEGER NOT NULL DEFAULT 0,
    `last_score_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `class_score_profile_class_id_key`(`class_id`),
    INDEX `class_score_profile_school_id_semester_id_idx`(`school_id`, `semester_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_score_record_batch` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `rule_id` BIGINT NOT NULL,
    `score_delta` INTEGER NOT NULL,
    `remark` VARCHAR(255) NULL,
    `source_terminal` ENUM('admin', 'display') NOT NULL,
    `source_role` VARCHAR(32) NULL,
    `operator_id` BIGINT NOT NULL,
    `operator_name` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `class_score_record_batch_school_id_created_at_idx`(`school_id`, `created_at`),
    INDEX `class_score_record_batch_rule_id_idx`(`rule_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_score_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `batch_id` BIGINT NULL,
    `rule_id` BIGINT NOT NULL,
    `subject_code` VARCHAR(32) NULL,
    `scene_code` VARCHAR(32) NULL,
    `dimension` VARCHAR(64) NULL,
    `tag` VARCHAR(64) NULL,
    `sentiment` ENUM('positive', 'negative') NOT NULL,
    `score_delta` INTEGER NOT NULL,
    `remark` VARCHAR(255) NULL,
    `source_terminal` ENUM('admin', 'display') NOT NULL,
    `source_role` VARCHAR(32) NULL,
    `operator_id` BIGINT NOT NULL,
    `operator_name` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `class_score_record_class_id_created_at_idx`(`class_id`, `created_at`),
    INDEX `class_score_record_rule_id_idx`(`rule_id`),
    INDEX `class_score_record_school_id_semester_id_idx`(`school_id`, `semester_id`),
    INDEX `class_score_record_batch_id_idx`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pet` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `category` VARCHAR(64) NULL,
    `rarity` VARCHAR(32) NULL,
    `source_type` VARCHAR(32) NOT NULL DEFAULT 'custom',
    `cover_url` VARCHAR(255) NULL,
    `description` VARCHAR(255) NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pet_school_id_idx`(`school_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pet_stage` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pet_id` BIGINT NOT NULL,
    `stage_no` INTEGER NOT NULL,
    `level_no` INTEGER NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `need_score_total` INTEGER NOT NULL,
    `animation_key` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pet_stage_pet_id_stage_no_key`(`pet_id`, `stage_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_pet` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT NOT NULL,
    `pet_id` BIGINT NOT NULL,
    `current_level` INTEGER NOT NULL DEFAULT 1,
    `current_stage_no` INTEGER NOT NULL DEFAULT 1,
    `total_score` INTEGER NOT NULL DEFAULT 0,
    `unlocked_at` DATETIME(3) NULL,
    `adopted_by` BIGINT NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_pet_student_id_key`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pet_level_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_pet_id` BIGINT NOT NULL,
    `student_id` BIGINT NOT NULL,
    `before_level` INTEGER NOT NULL,
    `after_level` INTEGER NOT NULL,
    `before_stage_no` INTEGER NOT NULL,
    `after_stage_no` INTEGER NOT NULL,
    `trigger_score_record_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `honor` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `category` ENUM('personal', 'collective', 'phase', 'longterm') NOT NULL,
    `icon_url` VARCHAR(255) NULL,
    `description` VARCHAR(255) NULL,
    `condition_type` VARCHAR(32) NULL,
    `condition_config` JSON NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `honor_school_id_idx`(`school_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `honor_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `honor_id` BIGINT NOT NULL,
    `target_type` VARCHAR(16) NOT NULL,
    `target_id` BIGINT NOT NULL,
    `school_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `student_id` BIGINT NULL,
    `granted_by` BIGINT NULL,
    `granted_at` DATETIME(3) NOT NULL,
    `remark` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reward` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `category` VARCHAR(32) NULL,
    `image_url` VARCHAR(255) NULL,
    `score_cost` INTEGER NOT NULL,
    `stock_qty` INTEGER NULL,
    `is_infinite_stock` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reward_school_id_idx`(`school_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reward_order` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `student_id` BIGINT NOT NULL,
    `reward_id` BIGINT NOT NULL,
    `score_cost` INTEGER NOT NULL,
    `status` ENUM('received', 'cancelled') NOT NULL DEFAULT 'received',
    `source_terminal` ENUM('admin', 'display') NOT NULL,
    `operator_id` BIGINT NOT NULL,
    `operator_role` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reward_order_class_id_idx`(`class_id`),
    INDEX `reward_order_student_id_idx`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `display_config` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `class_id` BIGINT NULL,
    `bg_image_url` VARCHAR(255) NULL,
    `title` VARCHAR(128) NULL,
    `subtitle` VARCHAR(255) NULL,
    `animation_speed` VARCHAR(16) NULL,
    `allow_skip_animation` BOOLEAN NOT NULL DEFAULT true,
    `default_mode` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `display_unlock_session` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `class_id` BIGINT NOT NULL,
    `display_terminal_code` VARCHAR(64) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `role_code` VARCHAR(32) NOT NULL,
    `unlocked_at` DATETIME(3) NOT NULL,
    `expired_at` DATETIME(3) NOT NULL,
    `status` ENUM('active', 'expired', 'locked') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `display_unlock_session_class_id_display_terminal_code_idx`(`class_id`, `display_terminal_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_student_snapshot` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `student_id` BIGINT NOT NULL,
    `snapshot_date` DATE NOT NULL,
    `period_type` ENUM('weekly', 'monthly') NOT NULL,
    `positive_summary` JSON NULL,
    `negative_summary` JSON NULL,
    `dimension_summary` JSON NULL,
    `trend_summary` JSON NULL,
    `ai_summary` TEXT NULL,
    `ai_suggestion` TEXT NULL,
    `generated_by` ENUM('manual') NOT NULL DEFAULT 'manual',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_student_snapshot_student_id_snapshot_date_idx`(`student_id`, `snapshot_date`),
    INDEX `ai_student_snapshot_class_id_period_type_idx`(`class_id`, `period_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_observation` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `student_id` BIGINT NOT NULL,
    `teacher_id` BIGINT NOT NULL,
    `observation_type` VARCHAR(32) NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `teacher_observation_student_id_created_at_idx`(`student_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operation_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `user_id` BIGINT NULL,
    `role_code` VARCHAR(32) NULL,
    `terminal_type` ENUM('admin', 'display') NOT NULL,
    `module` VARCHAR(64) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `target_type` VARCHAR(32) NULL,
    `target_id` BIGINT NULL,
    `detail` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operation_log_school_id_created_at_idx`(`school_id`, `created_at`),
    INDEX `operation_log_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `semester` ADD CONSTRAINT `semester_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role` ADD CONSTRAINT `role_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permission_rel` ADD CONSTRAINT `role_permission_rel_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permission_rel` ADD CONSTRAINT `role_permission_rel_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_scope` ADD CONSTRAINT `user_scope_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_scope` ADD CONSTRAINT `user_scope_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_homeroom_teacher_id_fkey` FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_profile` ADD CONSTRAINT `student_profile_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_profile` ADD CONSTRAINT `student_profile_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_group` ADD CONSTRAINT `class_group_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_group_rel` ADD CONSTRAINT `student_group_rel_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_group_rel` ADD CONSTRAINT `student_group_rel_class_group_id_fkey` FOREIGN KEY (`class_group_id`) REFERENCES `class_group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_rule` ADD CONSTRAINT `score_rule_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_rule` ADD CONSTRAINT `score_rule_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_rule` ADD CONSTRAINT `score_rule_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_rule` ADD CONSTRAINT `score_rule_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record` ADD CONSTRAINT `score_record_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record` ADD CONSTRAINT `score_record_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record` ADD CONSTRAINT `score_record_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record` ADD CONSTRAINT `score_record_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record` ADD CONSTRAINT `score_record_class_group_id_fkey` FOREIGN KEY (`class_group_id`) REFERENCES `class_group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record` ADD CONSTRAINT `score_record_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `score_rule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record` ADD CONSTRAINT `score_record_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record_batch` ADD CONSTRAINT `score_record_batch_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record_batch` ADD CONSTRAINT `score_record_batch_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record_batch` ADD CONSTRAINT `score_record_batch_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `score_rule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record_batch_item` ADD CONSTRAINT `score_record_batch_item_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `score_record_batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record_batch_item` ADD CONSTRAINT `score_record_batch_item_score_record_id_fkey` FOREIGN KEY (`score_record_id`) REFERENCES `score_record`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_record_batch_item` ADD CONSTRAINT `score_record_batch_item_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_profile` ADD CONSTRAINT `class_score_profile_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_profile` ADD CONSTRAINT `class_score_profile_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_profile` ADD CONSTRAINT `class_score_profile_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record_batch` ADD CONSTRAINT `class_score_record_batch_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record_batch` ADD CONSTRAINT `class_score_record_batch_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `score_rule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record_batch` ADD CONSTRAINT `class_score_record_batch_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `class_score_record_batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `score_rule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pet` ADD CONSTRAINT `pet_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pet_stage` ADD CONSTRAINT `pet_stage_pet_id_fkey` FOREIGN KEY (`pet_id`) REFERENCES `pet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_pet` ADD CONSTRAINT `student_pet_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_pet` ADD CONSTRAINT `student_pet_pet_id_fkey` FOREIGN KEY (`pet_id`) REFERENCES `pet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_pet` ADD CONSTRAINT `student_pet_adopted_by_fkey` FOREIGN KEY (`adopted_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pet_level_log` ADD CONSTRAINT `pet_level_log_student_pet_id_fkey` FOREIGN KEY (`student_pet_id`) REFERENCES `student_pet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pet_level_log` ADD CONSTRAINT `pet_level_log_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pet_level_log` ADD CONSTRAINT `pet_level_log_trigger_score_record_id_fkey` FOREIGN KEY (`trigger_score_record_id`) REFERENCES `score_record`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `honor` ADD CONSTRAINT `honor_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `honor_record` ADD CONSTRAINT `honor_record_honor_id_fkey` FOREIGN KEY (`honor_id`) REFERENCES `honor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `honor_record` ADD CONSTRAINT `honor_record_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `honor_record` ADD CONSTRAINT `honor_record_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `honor_record` ADD CONSTRAINT `honor_record_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `honor_record` ADD CONSTRAINT `honor_record_granted_by_fkey` FOREIGN KEY (`granted_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward` ADD CONSTRAINT `reward_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_order` ADD CONSTRAINT `reward_order_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_order` ADD CONSTRAINT `reward_order_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_order` ADD CONSTRAINT `reward_order_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_order` ADD CONSTRAINT `reward_order_reward_id_fkey` FOREIGN KEY (`reward_id`) REFERENCES `reward`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_order` ADD CONSTRAINT `reward_order_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `display_config` ADD CONSTRAINT `display_config_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `display_config` ADD CONSTRAINT `display_config_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `display_unlock_session` ADD CONSTRAINT `display_unlock_session_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `display_unlock_session` ADD CONSTRAINT `display_unlock_session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_student_snapshot` ADD CONSTRAINT `ai_student_snapshot_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_student_snapshot` ADD CONSTRAINT `ai_student_snapshot_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_student_snapshot` ADD CONSTRAINT `ai_student_snapshot_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_student_snapshot` ADD CONSTRAINT `ai_student_snapshot_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_observation` ADD CONSTRAINT `teacher_observation_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_observation` ADD CONSTRAINT `teacher_observation_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_observation` ADD CONSTRAINT `teacher_observation_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_observation` ADD CONSTRAINT `teacher_observation_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_log` ADD CONSTRAINT `operation_log_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_log` ADD CONSTRAINT `operation_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

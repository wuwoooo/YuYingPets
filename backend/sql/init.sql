CREATE DATABASE IF NOT EXISTS `yuyingpets` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `yuyingpets`;
SET NAMES utf8mb4;
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

DELETE FROM `grade_config`
WHERE `school_id` = 1
  AND `code` NOT IN ('G7', 'G8', 'G9');

INSERT INTO `grade_config` (`school_id`, `code`, `name`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
  (1, 'G7', '七年级', 1, 'enabled', NOW(3), NOW(3)),
  (1, 'G8', '八年级', 2, 'enabled', NOW(3), NOW(3)),
  (1, 'G9', '九年级', 3, 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`),
  `deleted_at` = NULL,
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
VALUES (1, 1, 1, 'CLASS-0701', 'G7', '七年级', '七(1)班', 1, 100, 'enabled', 'enabled', NOW(3), NOW(3))
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

INSERT INTO `class_score_profile` (`school_id`, `semester_id`, `class_id`, `current_score`, `total_score`, `positive_count_7d`, `negative_count_7d`, `updated_at`)
SELECT `school_id`, `semester_id`, `id`, 0, 0, 0, 0, NOW(3)
FROM `class`
WHERE `school_id` = 1
ON DUPLICATE KEY UPDATE
  `updated_at` = VALUES(`updated_at`);

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
  `id`, `school_id`, `semester_id`, `module_type`, `scene_code`, `code`, `name`, `score_type`, `score_mode`, `score_target`,
  `score_value`, `dimension`, `tag`, `sentiment`, `is_high_frequency`, `display_enabled`, `admin_enabled`,
  `status`, `created_by`, `updated_by`, `created_at`, `updated_at`
)
VALUES
  (1, 1, 1, 'general', 'classroom', 'CLASS_POSITIVE_SPEAK', '课堂积极发言', 'add', 'fixed', 'student', 2, '课堂表现', '积极发言', 'positive', 1, 1, 1, 'enabled', 1, 1, NOW(3), NOW(3)),
  (2, 1, 1, 'general', 'classroom', 'CLASS_DISCIPLINE_REMIND', '课堂纪律提醒', 'deduct', 'fixed', 'student', 1, '课堂表现', '课堂纪律', 'negative', 1, 1, 1, 'enabled', 1, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `score_type` = VALUES(`score_type`),
  `score_target` = VALUES(`score_target`),
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

DELETE FROM `reward_order`
WHERE `school_id` = 1;

DELETE FROM `reward`
WHERE `school_id` = 1;

INSERT INTO `reward` (`school_id`, `code`, `name`, `category`, `image_url`, `score_cost`, `stock_qty`, `is_infinite_stock`, `status`, `created_at`, `updated_at`)
VALUES
  (1, 'REWARD-CALENDAR', '育英台历', '文化周边', '/uploads/rewards/gift-calendar.jpg', 120, 30, 0, 'enabled', NOW(3), NOW(3)),
  (1, 'REWARD-CARD', '育英小卡', '文化周边', '/uploads/rewards/gift-card.jpg', 80, 80, 0, 'enabled', NOW(3), NOW(3)),
  (1, 'REWARD-TOTE-BAG', '育英布袋', '实用礼品', '/uploads/rewards/gift-tote-bag.jpg', 160, 40, 0, 'enabled', NOW(3), NOW(3)),
  (1, 'REWARD-PILLOW', '育英抱枕', '生活用品', '/uploads/rewards/gift-pillow.jpg', 220, 20, 0, 'enabled', NOW(3), NOW(3)),
  (1, 'REWARD-CUP', '育英水杯', '生活用品', '/uploads/rewards/gift-cup.jpg', 140, 50, 0, 'enabled', NOW(3), NOW(3)),
  (1, 'REWARD-KEYCHAIN', '育英钥匙扣', '文化周边', '/uploads/rewards/gift-keychain.jpg', 60, 120, 0, 'enabled', NOW(3), NOW(3));

DELETE FROM `honor_record`
WHERE `school_id` = 1;

DELETE FROM `honor`
WHERE `school_id` = 1;

INSERT INTO `honor` (`school_id`, `code`, `name`, `category`, `icon_url`, `description`, `condition_type`, `status`, `created_at`, `updated_at`)
VALUES
  (1, 'HONOR-CLASS-FOCUS', '课堂专注之星', 'personal', '/uploads/honors/honor-focus.svg', '课堂专注、主动思考并持续保持学习投入。', '连续一周课堂专注表现优秀', 'enabled', NOW(3), NOW(3)),
  (1, 'HONOR-READING-STAR', '阅读成长之星', 'personal', '/uploads/honors/honor-reading.svg', '阅读习惯稳定，能输出读书笔记与分享。', '月度阅读任务达成', 'enabled', NOW(3), NOW(3)),
  (1, 'HONOR-HELPER-STAR', '乐于助人之星', 'personal', '/uploads/honors/honor-help.svg', '主动帮助同学，具备积极合作与服务意识。', '同伴互助表现突出', 'enabled', NOW(3), NOW(3)),
  (1, 'HONOR-SPORT-STAR', '运动活力之星', 'personal', '/uploads/honors/honor-sport.svg', '积极参与体育活动，展现健康阳光风貌。', '体育活动参与度高', 'enabled', NOW(3), NOW(3)),
  (1, 'HONOR-PROGRESS-STAR', '学习进步之星', 'phase', '/uploads/honors/honor-progress.svg', '阶段性提升明显，学习态度与结果同步进步。', '阶段成绩与行为评价双提升', 'enabled', NOW(3), NOW(3)),
  (1, 'HONOR-TEAM-PIONEER', '班级协作先锋', 'collective', '/uploads/honors/honor-team.svg', '集体协作高效，班级任务执行力强。', '班级协同活动表现优秀', 'enabled', NOW(3), NOW(3)),
  (1, 'HONOR-CIVILIZED-CLASS', '文明示范班集体', 'collective', '/uploads/honors/honor-civilized.svg', '班风学风优良，行为规范与课堂秩序突出。', '月度文明班评选达标', 'enabled', NOW(3), NOW(3)),
  (1, 'HONOR-EXCELLENCE-LONGTERM', '卓越成长徽章', 'longterm', '/uploads/honors/honor-excellence.svg', '长期稳定优秀，在学习与品德上持续领跑。', '学期综合表现持续优秀', 'enabled', NOW(3), NOW(3));

INSERT INTO `display_config` (`id`, `school_id`, `class_id`, `title`, `subtitle`, `allow_skip_animation`, `default_mode`, `created_at`, `updated_at`)
VALUES (1, 1, 1, '育英星宠', '欢迎进入七(1)班', 1, 'class-home', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `subtitle` = VALUES(`subtitle`),
  `allow_skip_animation` = VALUES(`allow_skip_animation`),
  `default_mode` = VALUES(`default_mode`),
  `updated_at` = NOW(3);

-- 标签归一化：诚信问题与作业质量问题分开归类
UPDATE `score_rule`
SET `tag` = '诚信规范',
    `updated_at` = NOW(3)
WHERE `deleted_at` IS NULL
  AND `sentiment` = 'negative'
  AND (
    `name` LIKE '%抄袭%'
    OR `name` LIKE '%伪造%'
    OR `name` LIKE '%作弊%'
    OR `name` LIKE '%造假%'
    OR `description` LIKE '%抄袭%'
    OR `description` LIKE '%伪造%'
    OR `description` LIKE '%作弊%'
    OR `description` LIKE '%造假%'
  );

UPDATE `score_rule`
SET `tag` = '作业质量',
    `updated_at` = NOW(3)
WHERE `deleted_at` IS NULL
  AND `scene_code` = 'homework'
  AND (
    `name` LIKE '%质量%'
    OR `name` LIKE '%优秀%'
    OR `name` LIKE '%良好%'
    OR `name` LIKE '%合格%'
    OR `name` LIKE '%敷衍%'
    OR `name` LIKE '%改错%'
  )
  AND NOT (
    `name` LIKE '%抄袭%'
    OR `name` LIKE '%伪造%'
    OR `name` LIKE '%作弊%'
    OR `name` LIKE '%造假%'
  );

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE `score_rule`
  ADD COLUMN `score_target` ENUM('student', 'class') NOT NULL DEFAULT 'student' AFTER `score_mode`;

CREATE INDEX `score_rule_score_target_idx` ON `score_rule`(`score_target`);

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

INSERT INTO `class_score_profile` (`school_id`, `semester_id`, `class_id`, `current_score`, `total_score`, `positive_count_7d`, `negative_count_7d`, `updated_at`)
SELECT `school_id`, `semester_id`, `id`, 0, 0, 0, 0, NOW(3)
FROM `class`
WHERE `deleted_at` IS NULL;

UPDATE `score_rule`
SET `score_target` = 'class'
WHERE `name` IN ('学生工具单收纳混乱', '学生工具单收纳整齐', '课间学生纪律');

ALTER TABLE `class_score_profile` ADD CONSTRAINT `class_score_profile_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_profile` ADD CONSTRAINT `class_score_profile_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_profile` ADD CONSTRAINT `class_score_profile_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_record_batch` ADD CONSTRAINT `class_score_record_batch_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_record_batch` ADD CONSTRAINT `class_score_record_batch_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `score_rule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_record_batch` ADD CONSTRAINT `class_score_record_batch_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `class_score_record_batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `score_rule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_score_record` ADD CONSTRAINT `class_score_record_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

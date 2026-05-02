CREATE TABLE `teacher_occupancy_rule` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `school_id` BIGINT NOT NULL,
  `rule_type` VARCHAR(32) NOT NULL DEFAULT 'research',
  `name` VARCHAR(128) NOT NULL,
  `weekdays` JSON NOT NULL,
  `subject_codes` JSON NOT NULL,
  `start_time` VARCHAR(8) NOT NULL,
  `end_time` VARCHAR(8) NOT NULL,
  `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
  `remark` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `teacher_occ_rule_school_type_status_idx` (`school_id`, `rule_type`, `status`),
  CONSTRAINT `teacher_occupancy_rule_school_id_fkey`
    FOREIGN KEY (`school_id`) REFERENCES `school`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `call_queue` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `school_id` BIGINT NOT NULL,
  `class_id` BIGINT NOT NULL,
  `location` VARCHAR(128) NOT NULL,
  `caller_id` BIGINT NOT NULL,
  `caller_name` VARCHAR(64) NOT NULL,
  `called_students` JSON NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `call_queue_school_id_idx`(`school_id`),
  INDEX `call_queue_class_id_status_idx`(`class_id`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

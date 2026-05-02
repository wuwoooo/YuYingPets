CREATE TABLE `pending_teacher_schedule_slot` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `school_id` BIGINT NOT NULL,
  `class_id` BIGINT NULL,
  `teacher_name` VARCHAR(64) NOT NULL,
  `weekday` INT NOT NULL,
  `period_no` INT NOT NULL,
  `start_time` VARCHAR(8) NOT NULL,
  `end_time` VARCHAR(8) NOT NULL,
  `subject` VARCHAR(64) NOT NULL,
  `class_name` VARCHAR(32) NULL,
  `source_file` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `pending_slot_school_teacher_idx`(`school_id`, `teacher_name`),
  INDEX `pending_slot_school_time_idx`(`school_id`, `weekday`, `start_time`, `end_time`),
  INDEX `pending_slot_school_class_idx`(`school_id`, `class_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pending_teacher_schedule_slot`
  ADD CONSTRAINT `pending_teacher_schedule_slot_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `pending_teacher_schedule_slot_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

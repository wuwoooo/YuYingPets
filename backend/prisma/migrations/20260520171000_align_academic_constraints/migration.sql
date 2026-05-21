SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_exam' AND COLUMN_NAME = 'updated_at' AND COLUMN_DEFAULT IS NOT NULL) > 0,
  'ALTER TABLE `academic_exam` ALTER COLUMN `updated_at` DROP DEFAULT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_score_record' AND COLUMN_NAME = 'updated_at' AND COLUMN_DEFAULT IS NOT NULL) > 0,
  'ALTER TABLE `academic_score_record` ALTER COLUMN `updated_at` DROP DEFAULT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_class_assignment' AND COLUMN_NAME = 'updated_at' AND COLUMN_DEFAULT IS NOT NULL) > 0,
  'ALTER TABLE `teacher_class_assignment` ALTER COLUMN `updated_at` DROP DEFAULT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_teacher_schedule_slot' AND INDEX_NAME = 'pending_slot_school_class_idx') > 0
    AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_teacher_schedule_slot' AND INDEX_NAME = 'pending_teacher_schedule_slot_school_id_class_id_idx') = 0,
  'ALTER TABLE `pending_teacher_schedule_slot` RENAME INDEX `pending_slot_school_class_idx` TO `pending_teacher_schedule_slot_school_id_class_id_idx`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_teacher_schedule_slot' AND INDEX_NAME = 'pending_slot_school_teacher_idx') > 0
    AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_teacher_schedule_slot' AND INDEX_NAME = 'pending_teacher_schedule_slot_school_id_teacher_name_idx') = 0,
  'ALTER TABLE `pending_teacher_schedule_slot` RENAME INDEX `pending_slot_school_teacher_idx` TO `pending_teacher_schedule_slot_school_id_teacher_name_idx`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_teacher_schedule_slot' AND INDEX_NAME = 'pending_slot_school_time_idx') > 0
    AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_teacher_schedule_slot' AND INDEX_NAME = 'pending_teacher_schedule_slot_school_id_weekday_start_time_e_idx') = 0,
  'ALTER TABLE `pending_teacher_schedule_slot` RENAME INDEX `pending_slot_school_time_idx` TO `pending_teacher_schedule_slot_school_id_weekday_start_time_e_idx`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_occupancy_rule' AND INDEX_NAME = 'teacher_occ_rule_school_type_status_idx') > 0
    AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_occupancy_rule' AND INDEX_NAME = 'teacher_occupancy_rule_school_id_rule_type_status_idx') = 0,
  'ALTER TABLE `teacher_occupancy_rule` RENAME INDEX `teacher_occ_rule_school_type_status_idx` TO `teacher_occupancy_rule_school_id_rule_type_status_idx`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_exam' AND CONSTRAINT_NAME = 'academic_exam_school_id_fkey') = 0,
  'ALTER TABLE `academic_exam` ADD CONSTRAINT `academic_exam_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_exam' AND CONSTRAINT_NAME = 'academic_exam_semester_id_fkey') = 0,
  'ALTER TABLE `academic_exam` ADD CONSTRAINT `academic_exam_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_score_record' AND CONSTRAINT_NAME = 'academic_score_record_school_id_fkey') = 0,
  'ALTER TABLE `academic_score_record` ADD CONSTRAINT `academic_score_record_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_score_record' AND CONSTRAINT_NAME = 'academic_score_record_semester_id_fkey') = 0,
  'ALTER TABLE `academic_score_record` ADD CONSTRAINT `academic_score_record_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_score_record' AND CONSTRAINT_NAME = 'academic_score_record_exam_id_fkey') = 0,
  'ALTER TABLE `academic_score_record` ADD CONSTRAINT `academic_score_record_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `academic_exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_score_record' AND CONSTRAINT_NAME = 'academic_score_record_class_id_fkey') = 0,
  'ALTER TABLE `academic_score_record` ADD CONSTRAINT `academic_score_record_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_score_record' AND CONSTRAINT_NAME = 'academic_score_record_student_id_fkey') = 0,
  'ALTER TABLE `academic_score_record` ADD CONSTRAINT `academic_score_record_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

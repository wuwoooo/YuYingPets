SET @sql = IF(
  (SELECT COUNT(*)
   FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'academic_score_record'
     AND INDEX_NAME = 'academic_score_record_exam_subject_class_student_idx') = 0,
  'ALTER TABLE `academic_score_record` ADD INDEX `academic_score_record_exam_subject_class_student_idx`(`exam_id`, `subject_code`, `class_id`, `student_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

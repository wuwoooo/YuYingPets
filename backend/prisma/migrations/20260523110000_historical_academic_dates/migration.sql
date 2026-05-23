ALTER TABLE `academic_exam`
  ADD COLUMN `exam_date` DATE NOT NULL DEFAULT '1970-01-01',
  ADD COLUMN `period_label` VARCHAR(128) NULL;

UPDATE `academic_exam`
SET `exam_date` = DATE(`imported_at`)
WHERE `exam_date` = '1970-01-01';

CREATE INDEX `academic_exam_school_id_exam_date_idx` ON `academic_exam`(`school_id`, `exam_date`);

ALTER TABLE `score_record`
  ADD COLUMN `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `affects_profile` BOOLEAN NOT NULL DEFAULT true;

UPDATE `score_record`
SET `occurred_at` = `created_at`
WHERE `created_at` IS NOT NULL;

CREATE INDEX `score_record_student_id_occurred_at_idx` ON `score_record`(`student_id`, `occurred_at`);
CREATE INDEX `score_record_class_id_occurred_at_idx` ON `score_record`(`class_id`, `occurred_at`);

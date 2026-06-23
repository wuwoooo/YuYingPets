CREATE INDEX `score_record_analytics_school_class_created_idx`
  ON `score_record` (`school_id`, `class_id`, `created_at`);

CREATE INDEX `score_record_analytics_school_class_occurred_idx`
  ON `score_record` (`school_id`, `class_id`, `occurred_at`);

CREATE INDEX `score_record_analytics_school_created_idx`
  ON `score_record` (`school_id`, `created_at`);

CREATE INDEX `score_record_analytics_school_semester_student_idx`
  ON `score_record` (`school_id`, `semester_id`, `student_id`);

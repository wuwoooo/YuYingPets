CREATE INDEX `academic_score_record_list_semester_subject_idx`
  ON `academic_score_record` (`school_id`, `semester_id`, `subject_code`, `exam_id`, `class_id`);

CREATE INDEX `academic_score_record_list_exam_subject_idx`
  ON `academic_score_record` (`school_id`, `exam_id`, `subject_code`, `class_id`);

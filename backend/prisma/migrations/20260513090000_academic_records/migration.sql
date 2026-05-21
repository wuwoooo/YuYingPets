CREATE TABLE IF NOT EXISTS `academic_exam` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `grade_name` VARCHAR(32) NULL,
    `name` VARCHAR(255) NOT NULL,
    `source_file` VARCHAR(255) NULL,
    `imported_by` BIGINT NULL,
    `imported_by_name` VARCHAR(64) NULL,
    `imported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `academic_exam_school_id_semester_id_idx`(`school_id`, `semester_id`),
    INDEX `academic_exam_grade_name_idx`(`grade_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `academic_score_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `exam_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `student_id` BIGINT NOT NULL,
    `student_no` VARCHAR(64) NOT NULL,
    `student_name` VARCHAR(64) NOT NULL,
    `class_name` VARCHAR(64) NOT NULL,
    `subject_code` VARCHAR(32) NOT NULL,
    `subject_name` VARCHAR(64) NOT NULL,
    `score` DECIMAL(8, 2) NULL,
    `joint_rank` INTEGER NULL,
    `school_rank` INTEGER NULL,
    `school_rank_delta` INTEGER NULL,
    `class_rank` INTEGER NULL,
    `class_rank_delta` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `academic_score_record_exam_id_student_id_subject_code_key`(`exam_id`, `student_id`, `subject_code`),
    INDEX `academic_score_record_student_id_subject_code_idx`(`student_id`, `subject_code`),
    INDEX `academic_score_record_class_id_subject_code_idx`(`class_id`, `subject_code`),
    INDEX `academic_score_record_school_id_semester_id_idx`(`school_id`, `semester_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

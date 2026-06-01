-- AlterTable
ALTER TABLE `class_group`
    ADD COLUMN `group_current_score` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `group_total_score` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `group_last_score_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `class_group_score_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` BIGINT NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `class_id` BIGINT NOT NULL,
    `class_group_id` BIGINT NOT NULL,
    `score_delta` INTEGER NOT NULL,
    `remark` VARCHAR(255) NULL,
    `source_terminal` ENUM('admin', 'display') NOT NULL,
    `source_role` VARCHAR(32) NULL,
    `operator_id` BIGINT NOT NULL,
    `operator_name` VARCHAR(64) NULL,
    `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `class_group_score_record_class_id_class_group_id_idx`(`class_id`, `class_group_id`),
    INDEX `class_group_score_record_school_id_semester_id_idx`(`school_id`, `semester_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `class_group_score_record` ADD CONSTRAINT `class_group_score_record_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_group_score_record` ADD CONSTRAINT `class_group_score_record_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_group_score_record` ADD CONSTRAINT `class_group_score_record_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_group_score_record` ADD CONSTRAINT `class_group_score_record_class_group_id_fkey` FOREIGN KEY (`class_group_id`) REFERENCES `class_group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_group_score_record` ADD CONSTRAINT `class_group_score_record_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

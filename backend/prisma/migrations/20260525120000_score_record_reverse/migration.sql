-- 学生评价撤销字段
ALTER TABLE `score_record`
  ADD COLUMN `reversed_at` DATETIME(3) NULL,
  ADD COLUMN `reversed_by_id` BIGINT NULL,
  ADD COLUMN `reverse_remark` VARCHAR(255) NULL;

ALTER TABLE `score_record`
  ADD INDEX `score_record_reversed_at_idx`(`reversed_at`);

ALTER TABLE `score_record`
  ADD CONSTRAINT `score_record_reversed_by_id_fkey`
  FOREIGN KEY (`reversed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

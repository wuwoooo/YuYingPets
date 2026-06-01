ALTER TABLE `reward`
  ADD COLUMN `scope_type` VARCHAR(16) NOT NULL DEFAULT 'global' AFTER `school_id`,
  ADD COLUMN `class_id` BIGINT NULL AFTER `scope_type`,
  ADD COLUMN `created_by` BIGINT NULL AFTER `status`,
  ADD COLUMN `updated_by` BIGINT NULL AFTER `created_by`;

ALTER TABLE `reward`
  ADD INDEX `reward_school_id_class_id_status_idx`(`school_id`, `class_id`, `status`),
  ADD INDEX `reward_created_by_idx`(`created_by`);

ALTER TABLE `reward`
  ADD CONSTRAINT `reward_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `reward_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `reward_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

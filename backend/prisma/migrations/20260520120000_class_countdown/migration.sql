ALTER TABLE `class`
  ADD COLUMN `countdown_title` VARCHAR(128) NULL AFTER `target_score`,
  ADD COLUMN `countdown_deadline_at` DATETIME(3) NULL AFTER `countdown_title`;

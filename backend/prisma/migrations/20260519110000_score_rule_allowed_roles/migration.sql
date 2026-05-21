ALTER TABLE `score_rule`
  ADD COLUMN `allowed_role_codes` VARCHAR(255) NULL AFTER `description`;

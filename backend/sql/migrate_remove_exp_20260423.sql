SET @schema_name = DATABASE();

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'school'
        AND COLUMN_NAME = 'pet_growth_thresholds'
    ),
    'ALTER TABLE `school` MODIFY COLUMN `pet_growth_thresholds` JSON NULL',
    'ALTER TABLE `school` ADD COLUMN `pet_growth_thresholds` JSON NULL AFTER `address`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'school'
        AND COLUMN_NAME = 'pet_growth_metric'
    ),
    'ALTER TABLE `school` DROP COLUMN `pet_growth_metric`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'student_profile'
        AND COLUMN_NAME = 'current_exp'
    ),
    'ALTER TABLE `student_profile` DROP COLUMN `current_exp`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'student_profile'
        AND COLUMN_NAME = 'total_exp'
    ),
    'ALTER TABLE `student_profile` DROP COLUMN `total_exp`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'score_rule'
        AND COLUMN_NAME = 'exp_value'
    ),
    'ALTER TABLE `score_rule` DROP COLUMN `exp_value`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'score_rule'
        AND COLUMN_NAME = 'min_exp'
    ),
    'ALTER TABLE `score_rule` DROP COLUMN `min_exp`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'score_rule'
        AND COLUMN_NAME = 'max_exp'
    ),
    'ALTER TABLE `score_rule` DROP COLUMN `max_exp`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'score_record'
        AND COLUMN_NAME = 'exp_delta'
    ),
    'ALTER TABLE `score_record` DROP COLUMN `exp_delta`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'score_record_batch'
        AND COLUMN_NAME = 'exp_delta'
    ),
    'ALTER TABLE `score_record_batch` DROP COLUMN `exp_delta`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'pet_stage'
        AND COLUMN_NAME = 'need_exp_total'
    ),
    'ALTER TABLE `pet_stage` RENAME COLUMN `need_exp_total` TO `need_score_total`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'student_pet'
        AND COLUMN_NAME = 'total_exp'
    ),
    'ALTER TABLE `student_pet` RENAME COLUMN `total_exp` TO `total_score`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'student_pet'
        AND COLUMN_NAME = 'total_score'
    ),
    'ALTER TABLE `student_pet` MODIFY COLUMN `total_score` INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE `student_pet` ADD COLUMN `total_score` INTEGER NOT NULL DEFAULT 0 AFTER `current_stage_no`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

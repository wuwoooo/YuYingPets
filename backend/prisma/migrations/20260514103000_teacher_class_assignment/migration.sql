CREATE TABLE `teacher_class_assignment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `school_id` BIGINT NOT NULL,
  `teacher_id` BIGINT NOT NULL,
  `class_id` BIGINT NOT NULL,
  `role_in_class` ENUM('homeroom', 'co_homeroom', 'subject_teacher') NOT NULL,
  `subject_code` VARCHAR(32) NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT false,
  `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `teacher_class_assignment_school_id_class_id_role_in_class_idx`(`school_id`, `class_id`, `role_in_class`),
  INDEX `teacher_class_assignment_school_id_teacher_id_idx`(`school_id`, `teacher_id`),
  INDEX `teacher_class_assignment_teacher_id_class_id_idx`(`teacher_id`, `class_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `teacher_class_assignment` (
  `school_id`,
  `teacher_id`,
  `class_id`,
  `role_in_class`,
  `subject_code`,
  `is_primary`,
  `status`,
  `created_at`,
  `updated_at`
)
SELECT
  c.`school_id`,
  c.`homeroom_teacher_id`,
  c.`id`,
  'homeroom',
  NULL,
  true,
  'enabled',
  NOW(3),
  NOW(3)
FROM `class` c
JOIN `user` u ON u.`id` = c.`homeroom_teacher_id`
JOIN `role` r ON r.`id` = u.`role_id`
WHERE c.`homeroom_teacher_id` IS NOT NULL
  AND c.`deleted_at` IS NULL
  AND u.`deleted_at` IS NULL
  AND u.`status` = 'enabled'
  AND r.`code` = 'homeroom_teacher';

INSERT INTO `teacher_class_assignment` (
  `school_id`,
  `teacher_id`,
  `class_id`,
  `role_in_class`,
  `subject_code`,
  `is_primary`,
  `status`,
  `created_at`,
  `updated_at`
)
SELECT
  u.`school_id`,
  us.`user_id`,
  us.`class_id`,
  'homeroom',
  NULL,
  true,
  'enabled',
  NOW(3),
  NOW(3)
FROM `user_scope` us
JOIN `user` u ON u.`id` = us.`user_id`
JOIN `role` r ON r.`id` = u.`role_id`
WHERE us.`scope_type` = 'class_scope'
  AND us.`class_id` IS NOT NULL
  AND u.`deleted_at` IS NULL
  AND u.`status` = 'enabled'
  AND r.`code` = 'homeroom_teacher'
  AND NOT EXISTS (
    SELECT 1
    FROM `teacher_class_assignment` tca
    WHERE tca.`teacher_id` = us.`user_id`
      AND tca.`class_id` = us.`class_id`
      AND tca.`role_in_class` = 'homeroom'
  );

INSERT INTO `teacher_class_assignment` (
  `school_id`,
  `teacher_id`,
  `class_id`,
  `role_in_class`,
  `subject_code`,
  `is_primary`,
  `status`,
  `created_at`,
  `updated_at`
)
SELECT
  u.`school_id`,
  us.`user_id`,
  us.`class_id`,
  'subject_teacher',
  us.`subject_code`,
  false,
  'enabled',
  NOW(3),
  NOW(3)
FROM `user_scope` us
JOIN `user` u ON u.`id` = us.`user_id`
WHERE us.`scope_type` = 'subject_class'
  AND us.`class_id` IS NOT NULL
  AND us.`subject_code` IS NOT NULL
  AND u.`deleted_at` IS NULL
  AND u.`status` = 'enabled'
  AND NOT EXISTS (
    SELECT 1
    FROM `teacher_class_assignment` tca
    WHERE tca.`teacher_id` = us.`user_id`
      AND tca.`class_id` = us.`class_id`
      AND tca.`role_in_class` = 'subject_teacher'
      AND tca.`subject_code` = us.`subject_code`
  );

UPDATE `class` c
JOIN (
  SELECT `class_id`, MIN(`teacher_id`) AS `teacher_id`
  FROM `teacher_class_assignment`
  WHERE `role_in_class` = 'homeroom'
    AND `status` = 'enabled'
  GROUP BY `class_id`
) tca ON tca.`class_id` = c.`id`
SET c.`homeroom_teacher_id` = tca.`teacher_id`
WHERE c.`homeroom_teacher_id` IS NULL;

DELETE tca
FROM `teacher_class_assignment` tca
JOIN `class` c ON c.`id` = tca.`class_id`
WHERE tca.`role_in_class` = 'homeroom'
  AND c.`homeroom_teacher_id` IS NOT NULL
  AND tca.`teacher_id` <> c.`homeroom_teacher_id`;

ALTER TABLE `teacher_class_assignment`
  ADD CONSTRAINT `teacher_class_assignment_school_id_fkey`
    FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_class_assignment_teacher_id_fkey`
    FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_class_assignment_class_id_fkey`
    FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

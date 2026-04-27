START TRANSACTION;

-- 1) 诚信问题归类：抄袭/伪造/作弊/造假
UPDATE `score_rule`
SET `tag` = '诚信规范',
    `updated_at` = NOW(3)
WHERE `deleted_at` IS NULL
  AND `sentiment` = 'negative'
  AND (
    `name` LIKE '%抄袭%'
    OR `name` LIKE '%伪造%'
    OR `name` LIKE '%作弊%'
    OR `name` LIKE '%造假%'
    OR `description` LIKE '%抄袭%'
    OR `description` LIKE '%伪造%'
    OR `description` LIKE '%作弊%'
    OR `description` LIKE '%造假%'
  );

-- 2) 作业质量问题归类：优秀/良好/合格/质量/敷衍/改错
UPDATE `score_rule`
SET `tag` = '作业质量',
    `updated_at` = NOW(3)
WHERE `deleted_at` IS NULL
  AND `scene_code` = 'homework'
  AND (
    `name` LIKE '%质量%'
    OR `name` LIKE '%优秀%'
    OR `name` LIKE '%良好%'
    OR `name` LIKE '%合格%'
    OR `name` LIKE '%敷衍%'
    OR `name` LIKE '%改错%'
  )
  AND NOT (
    `name` LIKE '%抄袭%'
    OR `name` LIKE '%伪造%'
    OR `name` LIKE '%作弊%'
    OR `name` LIKE '%造假%'
  );

COMMIT;

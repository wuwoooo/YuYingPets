SET NAMES utf8mb4;
START TRANSACTION;

-- 将萌宠封面图 URL 从旧后缀统一迁移为 .png（兼容旧版 MySQL，不使用 REGEXP_REPLACE）
UPDATE `pet`
SET `cover_url` = REPLACE(REPLACE(REPLACE(REPLACE(`cover_url`, '.jpeg', '.png'), '.jpg', '.png'), '.webp', '.png'), '.gif', '.png')
WHERE `cover_url` LIKE '/assets/pets/%'
  AND `cover_url` REGEXP '\\.(jpg|jpeg|webp|gif)$';

-- 将萌宠成长阶段图 URL 从旧后缀统一迁移为 .png（兼容旧版 MySQL，不使用 REGEXP_REPLACE）
UPDATE `pet_stage`
SET `image_url` = REPLACE(REPLACE(REPLACE(REPLACE(`image_url`, '.jpeg', '.png'), '.jpg', '.png'), '.webp', '.png'), '.gif', '.png')
WHERE `image_url` LIKE '/assets/pets/%'
  AND `image_url` REGEXP '\\.(jpg|jpeg|webp|gif)$';

COMMIT;

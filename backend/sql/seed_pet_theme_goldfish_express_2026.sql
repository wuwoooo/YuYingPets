-- 金鱼列车主题皮肤（composite: 仅 theme_backdrop，金鱼合成在氛围图内）
-- theme_group = goldfish_express_2026
SET NAMES utf8mb4;
SET @school_id := 1;

INSERT INTO `pet_decoration`
  (`school_id`, `code`, `name`, `type`, `theme_group`, `theme_free_rule`, `image_url`, `preview_url`, `unlock_level`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
  (@school_id, 'backdrop_theme_goldfish_express_2026', '金鱼列车·氛围', 'theme_backdrop', 'goldfish_express_2026', NULL, '/assets/pet-decorations/1024/backdrop_theme_goldfish_express_2026.png', '/assets/pet-decorations/400/backdrop_theme_goldfish_express_2026.png', 1, 121, 'enabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `theme_group` = VALUES(`theme_group`),
  `theme_free_rule` = VALUES(`theme_free_rule`),
  `image_url` = VALUES(`image_url`),
  `preview_url` = VALUES(`preview_url`),
  `unlock_level` = VALUES(`unlock_level`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

-- 金鱼已并入 backdrop，停用独立饰品层
UPDATE `pet_decoration`
SET `status` = 'disabled', `updated_at` = NOW(3)
WHERE `code` = 'acc_theme_goldfish_express_2026';

UPDATE `student_pet_decoration` spd
INNER JOIN `pet_decoration` pd ON pd.id = spd.decoration_id
SET spd.is_equipped = 0
WHERE pd.theme_group = 'goldfish_express_2026'
  AND pd.status = 'disabled'
  AND spd.is_equipped = 1;

-- 6.1 儿童节主题皮肤 · 六一童梦（composite: theme_backdrop + accessory）
-- theme_group = children_day_2026
-- theme_free_rule：每年 6 月 1 日（中国时区）限时免费换装
SET NAMES utf8mb4;
SET @school_id := 1;
SET @theme_free_rule := CAST('{"kind":"annual","month":6,"day":1}' AS JSON);

INSERT INTO `pet_decoration`
  (`school_id`, `code`, `name`, `type`, `theme_group`, `theme_free_rule`, `image_url`, `preview_url`, `unlock_level`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
  (@school_id, 'backdrop_theme_children_day_2026', '六一童梦·氛围', 'theme_backdrop', 'children_day_2026', @theme_free_rule, '/assets/pet-decorations/1024/backdrop_theme_children_day_2026.png', '/assets/pet-decorations/400/backdrop_theme_children_day_2026.png', 1, 101, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'acc_theme_children_day_2026', '六一童梦·气球', 'accessory', 'children_day_2026', @theme_free_rule, '/assets/pet-decorations/1024/acc_theme_children_day_2026.png', '/assets/pet-decorations/400/acc_theme_children_day_2026.png', 1, 103, 'enabled', NOW(3), NOW(3))
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

-- 停用 legacy 三层中的背景/边框（保留历史记录，避免与 backdrop 叠加）
UPDATE `pet_decoration`
SET `status` = 'disabled', `updated_at` = NOW(3)
WHERE `code` IN ('bg_theme_children_day_2026', 'frame_theme_children_day_2026');

-- 停用主题时自动卸下对应装扮
UPDATE `student_pet_decoration` spd
INNER JOIN `pet_decoration` pd ON pd.id = spd.decoration_id
SET spd.is_equipped = 0
WHERE pd.theme_group = 'children_day_2026'
  AND pd.status = 'disabled'
  AND spd.is_equipped = 1;

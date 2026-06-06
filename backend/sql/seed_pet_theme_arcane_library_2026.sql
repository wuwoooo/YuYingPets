-- 秘典书廊主题皮肤（composite: theme_backdrop + accessory）
-- theme_group = arcane_library_2026
SET NAMES utf8mb4;
SET @school_id := 1;

INSERT INTO `pet_decoration`
  (`school_id`, `code`, `name`, `type`, `theme_group`, `theme_free_rule`, `image_url`, `preview_url`, `unlock_level`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
  (@school_id, 'backdrop_theme_arcane_library_2026', '秘典书廊·氛围', 'theme_backdrop', 'arcane_library_2026', NULL, '/assets/pet-decorations/1024/backdrop_theme_arcane_library_2026.png', '/assets/pet-decorations/400/backdrop_theme_arcane_library_2026.png', 1, 131, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'acc_theme_arcane_library_2026', '秘典书廊·魔典', 'accessory', 'arcane_library_2026', NULL, '/assets/pet-decorations/1024/acc_theme_arcane_library_2026.png', '/assets/pet-decorations/400/acc_theme_arcane_library_2026.png', 1, 133, 'enabled', NOW(3), NOW(3))
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

UPDATE `student_pet_decoration` spd
INNER JOIN `pet_decoration` pd ON pd.id = spd.decoration_id
SET spd.is_equipped = 0
WHERE pd.theme_group = 'arcane_library_2026'
  AND pd.status = 'disabled'
  AND spd.is_equipped = 1;

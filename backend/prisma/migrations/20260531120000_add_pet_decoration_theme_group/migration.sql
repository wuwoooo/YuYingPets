-- 主题皮肤：同一 theme_group 下的 background + frame + accessory 组成一套
ALTER TABLE `pet_decoration`
  ADD COLUMN `theme_group` VARCHAR(64) NULL AFTER `type`;

CREATE INDEX `pet_decoration_school_id_theme_group_idx`
  ON `pet_decoration` (`school_id`, `theme_group`);

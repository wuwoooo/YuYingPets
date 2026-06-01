-- 主题皮肤限时免费规则（JSON，同一 theme_group 下各层保持一致）
-- 示例：6.1 儿童节每年 6 月 1 日免费
ALTER TABLE `pet_decoration`
  ADD COLUMN `theme_free_rule` JSON NULL AFTER `theme_group`;

-- 萌宠装扮更换积分消耗（默认 10，可在后台「萌宠成长」配置）
ALTER TABLE `school` ADD COLUMN `pet_deco_change_cost` INTEGER NOT NULL DEFAULT 10;

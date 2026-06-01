-- 补发「首次免费更换」标记：false 表示尚未使用补发/领养赠送的免费次数
ALTER TABLE `student_pet` ADD COLUMN `deco_free_change_used` BOOLEAN NOT NULL DEFAULT false;

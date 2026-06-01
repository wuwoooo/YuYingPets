-- 宠物装饰种子数据（背景 8 + 边框 8 + 饰品 4 启用 = 20）
-- unlock_level=1：基础装饰，全员可花积分使用；unlock_level>1 预留给后续 IP/高等级主题
SET NAMES utf8mb4;
SET @school_id := 1;

INSERT INTO `pet_decoration` (`school_id`, `code`, `name`, `type`, `image_url`, `preview_url`, `unlock_level`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
  (@school_id, 'bg_campus_morning', '学园晨光', 'background', '/assets/pet-decorations/1024/bg_campus_morning.png', '/assets/pet-decorations/400/bg_campus_morning.png', 1, 1, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'bg_campus_sky', '蓝天课桌', 'background', '/assets/pet-decorations/1024/bg_campus_sky.png', '/assets/pet-decorations/400/bg_campus_sky.png', 1, 2, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'bg_star_night', '星空夜幕', 'background', '/assets/pet-decorations/1024/bg_star_night.png', '/assets/pet-decorations/400/bg_star_night.png', 1, 3, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'bg_nature_meadow', '春日草地', 'background', '/assets/pet-decorations/1024/bg_nature_meadow.png', '/assets/pet-decorations/400/bg_nature_meadow.png', 1, 4, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'bg_star_galaxy', '银河流光', 'background', '/assets/pet-decorations/1024/bg_star_galaxy.png', '/assets/pet-decorations/400/bg_star_galaxy.png', 1, 5, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'bg_nature_sakura', '樱花晴空', 'background', '/assets/pet-decorations/1024/bg_nature_sakura.png', '/assets/pet-decorations/400/bg_nature_sakura.png', 1, 6, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'bg_honor_rainbow', '彩虹庆典', 'background', '/assets/pet-decorations/1024/bg_honor_rainbow.png', '/assets/pet-decorations/400/bg_honor_rainbow.png', 1, 7, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'bg_honor_golden', '黄金殿堂', 'background', '/assets/pet-decorations/1024/bg_honor_golden.png', '/assets/pet-decorations/400/bg_honor_golden.png', 1, 8, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'frame_simple_white', '简约白框', 'frame', '/assets/pet-decorations/1024/frame_simple_white.png', '/assets/pet-decorations/400/frame_simple_white.png', 1, 1, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'frame_star_corner', '星星角饰', 'frame', '/assets/pet-decorations/1024/frame_star_corner.png', '/assets/pet-decorations/400/frame_star_corner.png', 1, 2, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'frame_nature_vine', '藤蔓花环', 'frame', '/assets/pet-decorations/1024/frame_nature_vine.png', '/assets/pet-decorations/400/frame_nature_vine.png', 1, 3, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'frame_star_nebula', '星云光环', 'frame', '/assets/pet-decorations/1024/frame_star_nebula.png', '/assets/pet-decorations/400/frame_star_nebula.png', 1, 4, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'frame_nature_bubble', '泡泡边框', 'frame', '/assets/pet-decorations/1024/frame_nature_bubble.png', '/assets/pet-decorations/400/frame_nature_bubble.png', 1, 5, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'frame_star_moon', '月亮星辰', 'frame', '/assets/pet-decorations/1024/frame_star_moon.png', '/assets/pet-decorations/400/frame_star_moon.png', 1, 6, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'frame_honor_ribbon', '荣誉绶带', 'frame', '/assets/pet-decorations/1024/frame_honor_ribbon.png', '/assets/pet-decorations/400/frame_honor_ribbon.png', 1, 7, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'frame_honor_crown', '钻石皇冠', 'frame', '/assets/pet-decorations/1024/frame_honor_crown.png', '/assets/pet-decorations/400/frame_honor_crown.png', 1, 8, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'acc_campus_cap', '迷你学士帽', 'accessory', '/assets/pet-decorations/1024/acc_campus_cap.png', '/assets/pet-decorations/400/acc_campus_cap.png', 1, 1, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'acc_star_wings', '星光小翼', 'accessory', '/assets/pet-decorations/1024/acc_star_wings.png', '/assets/pet-decorations/400/acc_star_wings.png', 1, 2, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'acc_cloud_wings', '云朵轻翼', 'accessory', '/assets/pet-decorations/1024/acc_cloud_wings.png', '/assets/pet-decorations/400/acc_cloud_wings.png', 1, 3, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'acc_soft_halo', '柔光星环', 'accessory', '/assets/pet-decorations/1024/acc_soft_halo.png', '/assets/pet-decorations/400/acc_soft_halo.png', 1, 4, 'enabled', NOW(3), NOW(3)),
  (@school_id, 'acc_mini_crown', '迷你星冠', 'accessory', '/assets/pet-decorations/1024/acc_mini_crown.png', '/assets/pet-decorations/400/acc_mini_crown.png', 1, 94, 'disabled', NOW(3), NOW(3)),
  (@school_id, 'acc_sparkle_badge', '星耀角标', 'accessory', '/assets/pet-decorations/1024/acc_sparkle_badge.png', '/assets/pet-decorations/400/acc_sparkle_badge.png', 1, 95, 'disabled', NOW(3), NOW(3)),
  (@school_id, 'acc_flower_red', '小红花', 'accessory', '/assets/pet-decorations/1024/acc_flower_red.png', '/assets/pet-decorations/400/acc_flower_red.png', 1, 91, 'disabled', NOW(3), NOW(3)),
  (@school_id, 'acc_star_glasses', '星星眼镜', 'accessory', '/assets/pet-decorations/1024/acc_star_glasses.png', '/assets/pet-decorations/400/acc_star_glasses.png', 1, 92, 'disabled', NOW(3), NOW(3)),
  (@school_id, 'acc_nature_leaf', '绿叶发饰', 'accessory', '/assets/pet-decorations/1024/acc_nature_leaf.png', '/assets/pet-decorations/400/acc_nature_leaf.png', 1, 93, 'disabled', NOW(3), NOW(3)),
  (@school_id, 'acc_nature_rainbow_badge', '彩虹徽章', 'accessory', '/assets/pet-decorations/1024/acc_nature_rainbow_badge.png', '/assets/pet-decorations/400/acc_nature_rainbow_badge.png', 1, 94, 'disabled', NOW(3), NOW(3)),
  (@school_id, 'acc_honor_medal', '荣誉勋章', 'accessory', '/assets/pet-decorations/1024/acc_honor_medal.png', '/assets/pet-decorations/400/acc_honor_medal.png', 1, 95, 'disabled', NOW(3), NOW(3)),
  (@school_id, 'acc_honor_halo', '皇冠光环', 'accessory', '/assets/pet-decorations/1024/acc_honor_halo.png', '/assets/pet-decorations/400/acc_honor_halo.png', 1, 96, 'disabled', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `image_url` = VALUES(`image_url`),
  `preview_url` = VALUES(`preview_url`),
  `unlock_level` = VALUES(`unlock_level`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`),
  `updated_at` = NOW(3);

-- 仅对 unlock_level>1 的限定主题，按等级写入解锁记录（基础装饰无需预解锁）
INSERT INTO `student_pet_decoration` (`student_pet_id`, `decoration_id`, `is_equipped`, `unlocked_at`, `created_at`)
SELECT sp.id, pd.id, 0, NOW(3), NOW(3)
FROM `student_pet` sp
INNER JOIN `student` s ON s.id = sp.student_id
INNER JOIN `pet_decoration` pd ON pd.school_id = s.school_id
  AND pd.status = 'enabled'
  AND pd.unlock_level > 1
  AND pd.unlock_level <= sp.current_level
WHERE s.school_id = @school_id
  AND NOT EXISTS (
    SELECT 1 FROM `student_pet_decoration` spd
    WHERE spd.student_pet_id = sp.id AND spd.decoration_id = pd.id
  );

-- 卸下已停用饰品，避免仍显示在萌宠身上
UPDATE `student_pet_decoration` spd
INNER JOIN `pet_decoration` pd ON pd.id = spd.decoration_id
SET spd.is_equipped = 0
WHERE pd.school_id = @school_id
  AND pd.status = 'disabled'
  AND spd.is_equipped = 1;

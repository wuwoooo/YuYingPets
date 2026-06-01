/** unlock_level=1 表示基础装饰，全员可用（消耗积分或免费次数）；>1 为限定 IP/高等级主题 */
export const PET_DECORATION_PUBLIC_UNLOCK_LEVEL = 1;

export function isPetDecorationLevelLocked(unlockLevel: number, currentLevel: number) {
  return unlockLevel > PET_DECORATION_PUBLIC_UNLOCK_LEVEL && currentLevel < unlockLevel;
}

export function isPetDecorationLevelGated(unlockLevel: number) {
  return unlockLevel > PET_DECORATION_PUBLIC_UNLOCK_LEVEL;
}

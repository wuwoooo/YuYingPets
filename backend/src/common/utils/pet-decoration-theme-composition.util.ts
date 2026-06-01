/** 主题皮肤组成：合成 backdrop 或 legacy 三层 */
export const THEME_BACKDROP_TYPE = 'theme_backdrop';
export const LEGACY_THEME_LAYER_TYPES = ['background', 'frame', 'accessory'] as const;
export const COMPOSITE_THEME_LAYER_TYPES = [THEME_BACKDROP_TYPE, 'accessory'] as const;

export type ThemeCompositionMode = 'composite' | 'layers';

export type ThemeComposition<T extends { type: string }> = {
  mode: ThemeCompositionMode;
  pieces: T[];
};

type ThemeDecorationRow = { type: string };

/** 解析主题组应装备的装饰件 */
export function resolveThemeComposition<T extends ThemeDecorationRow>(
  decorations: T[],
): ThemeComposition<T> | null {
  const byType = new Map<string, T>();
  decorations.forEach((row) => {
    if (!byType.has(row.type)) {
      byType.set(row.type, row);
    }
  });

  const backdrop = byType.get(THEME_BACKDROP_TYPE);
  if (backdrop) {
    const pieces = [backdrop];
    const accessory = byType.get('accessory');
    if (accessory) pieces.push(accessory);
    return { mode: 'composite', pieces };
  }

  const legacyPieces = LEGACY_THEME_LAYER_TYPES.map((type) => byType.get(type)).filter(
    (item): item is T => !!item,
  );
  if (legacyPieces.length < LEGACY_THEME_LAYER_TYPES.length) {
    return null;
  }
  return { mode: 'layers', pieces: legacyPieces };
}

/** 合成 backdrop 与 legacy 背景/边框互斥 */
export const THEME_BACKDROP_EXCLUSIVE_TYPES = [
  'background',
  'frame',
  THEME_BACKDROP_TYPE,
] as const;

export function getThemeDisplayName<T extends ThemeDecorationRow & { name?: string }>(
  pieces: T[],
  fallback: string,
): string {
  const backdrop = pieces.find((item) => item.type === THEME_BACKDROP_TYPE);
  if (backdrop?.name) {
    return backdrop.name.replace(/·氛围$/, '').replace(/·背景$/, '');
  }
  const background = pieces.find((item) => item.type === 'background');
  if (background?.name) {
    return background.name.replace(/·背景$/, '').replace(/背景$/, '');
  }
  return fallback;
}

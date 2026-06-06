# 育英星宠 · 主题皮肤 AI 生成清单

> **用途**：主题皮肤 = **合成氛围（backdrop）+ 饰品** 一套联动，一键装备。  
> **主题**：`mini_adventure_2026` · **迷你冒险**（沙盒方块冒险风，原创设计）  
> **版本**：v1.0（composite backdrop）  
> **素材数量**：2 张（BD + ACC）

---

## 一、主题概念

| 项目 | 值 |
|------|-----|
| theme_group | `mini_adventure_2026` |
| 主题名 | 迷你冒险 |
| 上线场景 | 装扮面板「主题」Tab |
| 视觉关键词 | 方块草地、像素天空、原木工作台、火把、矿石、沙盒冒险、明亮白天 |
| 主色 | 草绿 `#5CB85C`、天蓝 `#87CEEB`、原木 `#C4A574`、矿石青 `#4ECDC4`、星光黄 `#FFD93D` |
| 风格 | 2D 扁平 + 轻像素块面，与 campus/star 系列一致；**不要写实 3D，不要使用任何游戏官方 Logo/角色** |

**套装组成（composite 模式）**

| 编号 | 文件名 | type | 中文名 | 叠加层 |
|------|--------|------|--------|--------|
| MA-BD | `backdrop_theme_mini_adventure_2026.png` | theme_backdrop | 迷你冒险·氛围 | z-index 1 最底 |
| MA-AC | `acc_theme_mini_adventure_2026.png` | accessory | 迷你冒险·镐斧 | z-index 4 左上饰品 |

**渲染顺序**：backdrop → 宠物 → accessory

**保存路径**

- 源图 1024：`backend/public/assets/pet-decorations/1024/`
- 缩略图 400：运行 `npm run pet-decorations:generate-400`

**系统叠加说明**  
宠物由程序居中偏下插入；backdrop 为满幅不透明 PNG；饰品为透明 PNG，**镐+矿石簇画在左上区域**，偏左贴边，避开正中萌宠。**不要画宠物、人物、动物本体**。

---

## 二、MA-BD · 迷你冒险·氛围（合成 backdrop）

| 项目 | 值 |
|------|-----|
| 导出文件名 | `backdrop_theme_mini_adventure_2026.png` |
| code | `backdrop_theme_mini_adventure_2026` |

**Positive Prompt**

```
Create one mobile game pet profile THEME BACKDROP asset — original sandbox block-world adventure theme (NOT Minecraft, NOT Mini World official art, no logos).

TECHNICAL REQUIREMENTS:
- Exact canvas size: 1024 x 1024 pixels, square 1:1
- Output: PNG, full opaque image, edge-to-edge fill (NOT transparent)
- sRGB, bright daytime, kid-friendly adventure mood

ART STYLE:
- Cute casual mobile game UI backdrop, 2D flat with light pixel/block aesthetic
- Block grass ground, pixel clouds in sky blue gradient, blocky trees on left/right sides
- Corner/frame accents: small crafting table, torch glow, ore cubes, vine blocks on edges only
- Colors: grass green #5CB85C, sky #87CEEB, wood #C4A574, ore teal #4ECDC4, star yellow #FFD93D

COMPOSITION:
- Do NOT draw any character, animal, pet, human, creature, or trademark logo
- Upper 45%: soft sky gradient with 2-3 stepped pixel clouds
- Sides: subtle block trees (brown trunk + green cube leaves), slightly soft focus
- Lower 35%: grass block tile pattern ground; center-bottom 40% relatively clean for pet overlay
- Edge decorations only — do not clutter pet zone
- Warm light from upper-left, gentle adventure atmosphere

MOOD: exploration, creativity, sandbox adventure, cheerful daylight
```

**Negative Prompt**

```
3D render, photorealistic, dark, horror, text, watermark, logo, brand, Minecraft, Mini World, pet, animal, human, face, transparent center, alpha channel, cluttered center, harsh shadow, low resolution, blurry
```

---

## 三、MA-AC · 迷你冒险·镐斧

| 项目 | 值 |
|------|-----|
| 导出文件名 | `acc_theme_mini_adventure_2026.png` |
| code | `acc_theme_mini_adventure_2026` |

**定位说明**  
程序按 **head 头饰模式** 叠加，锚点偏左上（`ACC_PLACEMENT.acc_theme_mini_adventure_2026`）。画 **Q 版像素镐 + 2～3 个小矿石方块**，主体在**画布左上 1/4 区域**，整体宽约 35%，下方留空给宠物头部。

**Positive Prompt**

```
Create one mobile game pet ACCESSORY sticker — cute pixel pickaxe with small ore cubes, sandbox adventure theme.

TECHNICAL REQUIREMENTS:
- Exact canvas size: 1024 x 1024 pixels
- Output: PNG with TRANSPARENT background (alpha)
- Single accessory group only, no pet, no human

ART STYLE:
- 2D flat cute sticker with light pixel/block style, clean edges
- One chibi cross pickaxe: wooden handle #C4A574, metal head gray with teal highlight #4ECDC4
- 2-3 small cube ores nearby: teal #4ECDC4 and gold #FFD93D, tiny sparkle accents

COMPOSITION:
- Place pickaxe + ores in UPPER-LEFT area (top 15-30%, left 5-22% of canvas)
- Cluster width roughly 30-38% of canvas; do NOT center horizontally
- Lower 55% of canvas must remain EMPTY transparent for pet head below
- Readable at 400px thumbnail size

MOOD: adventure, mining, playful sandbox
```

**Negative Prompt**

```
pet, animal, human, full body, wings, background scene, opaque rectangle, 3D plastic, text, watermark, logo, oversized object covering center, centered composition
```

---

## 四、入库与部署 checklist

1. 将 2 张 PNG 放入 `backend/public/assets/pet-decorations/1024/`
2. 执行 `npm run pet-decorations:generate-400`
3. 执行 `npm run prisma:db:execute:pet-theme-mini-adventure-2026`
4. 上传 `public/assets/pet-decorations/` 到服务器
5. 部署 display-app
6. Display 验证：萌宠档案 → 更换装扮 → **主题** Tab → 「迷你冒险」

**临时下架**：将 seed 中对应条目 `status` 改为 `disabled`，重新执行 seed 即可自动卸下。

---

## 五、前端元数据（已实现）

| 字段 | 值 |
|------|-----|
| `PET_DECO_THEME_META.mini_adventure_2026.name` | 迷你冒险 |
| `badge` | 冒险 |
| `accent` | `#5CB85C` |
| `ACC_PLACEMENT` | 左上贴边，与六一气球同类偏移策略 |

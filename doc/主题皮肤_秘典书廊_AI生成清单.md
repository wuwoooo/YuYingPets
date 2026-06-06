# 育英星宠 · 主题皮肤 AI 生成清单

> **用途**：主题皮肤 = **合成氛围（backdrop）+ 饰品** 一套联动，一键装备。  
> **主题**：`arcane_library_2026` · **秘典书廊**（哥特图书馆螺旋阶梯，参考暗色学院风）  
> **版本**：v1.0（composite backdrop）  
> **素材数量**：2 张（BD + ACC）

---

## 一、主题概念

| 项目 | 值 |
|------|-----|
| theme_group | `arcane_library_2026` |
| 主题名 | 秘典书廊 |
| 上线场景 | 装扮面板「主题」Tab |
| 视觉关键词 | 螺旋楼梯、满墙书架、彩色玻璃天窗、木雕金饰、魔法学者、暗色学院 |
| 主色 | 胡桃木 `#5C3D2E`、古董金 `#C9A227`、青绿玻璃 `#2A9D8F`、深红皮面 `#8B2942`、米色地毯 `#D4C4A8` |
| 风格 | 2D 插画 + 轻哥特装饰，与 campus/star 系列一致；**不要写实 3D 渲染，不要知名 IP 角色** |

**套装组成（composite 模式）**

| 编号 | 文件名 | type | 中文名 | 叠加层 |
|------|--------|------|--------|--------|
| AL-BD | `backdrop_theme_arcane_library_2026.png` | theme_backdrop | 秘典书廊·氛围 | z-index 1 最底 |
| AL-AC | `acc_theme_arcane_library_2026.png` | accessory | 秘典书廊·魔典 | z-index 4 左上饰品 |

**渲染顺序**：backdrop → 宠物 → accessory

**保存路径**

- 源图 1024：`backend/public/assets/pet-decorations/1024/`
- 缩略图 400：运行 `npm run pet-decorations:generate-400`

**系统叠加说明**  
宠物由程序居中偏下插入（站在地毯上）；backdrop 为满幅不透明 PNG；饰品为透明 PNG，**悬浮魔典画在左上区域**，避开萌宠头部。**不要画宠物、人物、动物本体**。

---

## 二、AL-BD · 秘典书廊·氛围（合成 backdrop）

| 项目 | 值 |
|------|-----|
| 导出文件名 | `backdrop_theme_arcane_library_2026.png` |
| code | `backdrop_theme_arcane_library_2026` |

**Positive Prompt**

```
Create one mobile game pet profile THEME BACKDROP asset — original grand gothic library interior with spiral staircase (dark academia fantasy, NOT photorealistic, no famous characters).

TECHNICAL REQUIREMENTS:
- Exact canvas size: 1024 x 1024 pixels, square 1:1
- Output: PNG, full opaque image, edge-to-edge fill (NOT transparent)
- sRGB, dramatic but kid-friendly magical library mood

ART STYLE:
- Cute casual mobile game UI backdrop, 2D illustrated with ornate wood carving details
- Towering bookshelves packed with leather-bound books (deep red, brown, tan)
- Grand wooden spiral staircase with gold filigree railings rising upward in background
- Circular stained-glass skylight at top with teal/cyan glow #2A9D8F
- Warm golden wall sconces, beige-gold patterned carpet on lower floor
- Colors: walnut #5C3D2E, antique gold #C9A227, teal glass #2A9D8F, burgundy #8B2942

COMPOSITION:
- Do NOT draw any character, animal, pet, human, floating book, or trademark logo
- Upper 45%: staircase rising, skylight glow, bookshelf towers on sides
- Lower 32%: patterned rug floor; center-bottom 40% relatively clean for pet overlay (pet stands on rug at stair base)
- Ornate details on edges and upper area — do not clutter pet zone
- Symmetrical majestic vertical composition, sense of height and wonder

MOOD: scholarly, magical, warm gold meets cool skylight, arcane library
```

**Negative Prompt**

```
3D render, photorealistic, horror, blood, text, watermark, logo, brand, pet, animal, human, face, transparent center, alpha channel, cluttered center, harsh shadow, low resolution, blurry, modern office
```

---

## 三、AL-AC · 秘典书廊·魔典

| 项目 | 值 |
|------|-----|
| 导出文件名 | `acc_theme_arcane_library_2026.png` |
| code | `acc_theme_arcane_library_2026` |

**定位说明**  
程序按 **canvas 角标模式** 叠加，锚点**左上**（`ACC_PLACEMENT.acc_theme_arcane_library_2026`，`transformOrigin: left top`）。画 **一本悬浮发光的魔法书 + 少量金色粒子/符文光点**，主体在**画布左上 1/4 区域**，整体宽约 30%，右下留空给萌宠头部。

**Positive Prompt**

```
Create one mobile game pet ACCESSORY sticker — floating magical open book with golden glow and tiny sparkles, dark academia style.

TECHNICAL REQUIREMENTS:
- Exact canvas size: 1024 x 1024 pixels
- Output: PNG with TRANSPARENT background (alpha)
- Single accessory group only, no pet, no human, no library interior

ART STYLE:
- 2D flat cute sticker with ornate but readable silhouette
- One levitating open spellbook: burgundy cover #8B2942, gold filigree #C9A227, soft teal magic glow #2A9D8F from pages
- 6-10 tiny golden light particles and subtle arcane rune glints around book

COMPOSITION:
- Place book cluster in UPPER-LEFT area (top 14-32%, left 5-22% of canvas)
- Cluster width roughly 26-32% of canvas; do NOT center horizontally
- Lower 58% and center-right must remain EMPTY transparent for pet below
- Book floats slightly tilted, magical but not scary
- Readable at 400px thumbnail size

MOOD: arcane, scholarly, gentle magic
```

**Negative Prompt**

```
pet, animal, human, full body, wings, background scene, opaque rectangle, 3D plastic, text, watermark, logo, oversized object covering center, centered composition, bookshelf, staircase, skull, horror
```

---

## 四、入库与部署 checklist

1. 将 2 张 PNG 放入 `backend/public/assets/pet-decorations/1024/`
2. 执行 `npm run pet-decorations:generate-400`
3. 执行 `npm run prisma:db:execute:pet-theme-arcane-library-2026`
4. 上传 `public/assets/pet-decorations/` 到服务器
5. 部署 display-app
6. Display 验证：萌宠档案 → 更换装扮 → **主题** Tab → 「秘典书廊」

---

## 五、前端元数据（已实现）

| 字段 | 值 |
|------|-----|
| `PET_DECO_THEME_META.arcane_library_2026.name` | 秘典书廊 |
| `badge` | 书阁 |
| `accent` | `#2A9D8F` |
| `ACC_PLACEMENT` | 左上贴边，`transformOrigin: left top` |

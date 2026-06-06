# 育英星宠 · 主题皮肤 AI 生成清单

> **用途**：主题皮肤 = **合成氛围（backdrop）** 一键装备；金鱼画在氛围图内，**不设独立饰品层**。  
> **主题**：`goldfish_express_2026` · **金鱼列车**（治愈系水下地铁，参考梦幻车厢+金鱼）  
> **版本**：v1.1（backdrop-only composite，金鱼背景合成）  
> **素材数量**：1 张（BD）

---

## 一、主题概念

| 项目 | 值 |
|------|-----|
| theme_group | `goldfish_express_2026` |
| 主题名 | 金鱼列车 |
| 上线场景 | 装扮面板「主题」Tab |
| 视觉关键词 | 地铁车厢、浅水地板、珊瑚粉座椅、天光、水纹折射、游动金鱼、治愈、梦幻 |
| 主色 | 珊瑚粉 `#F4A0A0`、暖白 `#FFF8F0`、金鱼橙 `#FF8C42`、水蓝 `#7EC8E3`、叶绿 `#6BBF59` |
| 风格 | 2D 插画 + 轻治愈系，与 campus/star 系列一致；**不要写实照片风，不要真实地铁 Logo/站名** |

**套装组成（backdrop-only composite）**

| 编号 | 文件名 | type | 中文名 | 叠加层 |
|------|--------|------|--------|--------|
| GE-BD | `backdrop_theme_goldfish_express_2026.png` | theme_backdrop | 金鱼列车·氛围 | z-index 1 最底（含金鱼） |

**渲染顺序**：backdrop（含金鱼）→ 宠物

**保存路径**

- 源图 1024：`backend/public/assets/pet-decorations/1024/`
- 缩略图 400：运行 `npm run pet-decorations:generate-400`

**系统叠加说明**  
宠物由程序居中偏下插入；backdrop 为满幅不透明 PNG，**金鱼作为场景元素画在氛围图内**（天窗上方、两侧、前景角落等多景深分布），正中偏下约 40% 区域留给萌宠站立，**不要画宠物、人物本体**。

---

## 二、GE-BD · 金鱼列车·氛围（含金鱼合成）

| 项目 | 值 |
|------|-----|
| 导出文件名 | `backdrop_theme_goldfish_express_2026.png` |
| code | `backdrop_theme_goldfish_express_2026` |

**Positive Prompt**

```
Create one mobile game pet profile THEME BACKDROP asset — original dreamy healing subway train interior submerged in shallow water, with cute goldfish integrated into the scene (NOT photorealistic, no real transit logos or station names).

TECHNICAL REQUIREMENTS:
- Exact canvas size: 1024 x 1024 pixels, square 1:1
- Output: PNG, full opaque image, edge-to-edge fill (NOT transparent)
- sRGB, bright airy mood, kid-friendly healing atmosphere

ART STYLE:
- Cute casual mobile game UI backdrop, 2D illustrated with soft painterly light
- Interior: clean white subway car walls, silver handrails, coral-pink cushioned benches on left/right
- Floor: shallow shimmering water layer with caustic light patterns, a few floating newspaper pages at edges only
- Ceiling: glass panels with water above, strong diagonal sunbeams from upper-right
- Windows/doors: soft green plants in pots near edges, blurred green outside view
- Goldfish: 5-8 cute orange goldfish #FF8C42 with flowing fins, scattered at DIFFERENT depths — some above ceiling glass, some mid-air near windows, 1-2 larger fish in lower foreground corners ONLY (left/right edges, not center)
- Colors: coral pink #F4A0A0, warm white #FFF8F0, water blue #7EC8E3, leaf green #6BBF59

COMPOSITION:
- Do NOT draw any pet, human, or trademark logo
- CRITICAL SAFE ZONE: center-bottom 40% width x 45% height must stay relatively clean — only water floor, light caustics, subtle reflections; NO goldfish faces or large fish bodies over this zone (pet stands here)
- Upper 40%: ceiling light rays, aqua glow, goldfish swimming near glass ceiling
- Side areas: benches, plants, 1-2 medium goldfish near window height
- Lower corners: optional 1 foreground goldfish per side at 15-25% from bottom edge, partially cropped for depth
- Fish feel naturally immersed in the train-water fantasy, harmonious not sticker-like

MOOD: healing, dreamy, bright, peaceful commute, living aquarium inside train
```

**Negative Prompt**

```
3D render, photorealistic, dark, horror, text, watermark, logo, brand, station name, pet, human, face, transparent center, alpha channel, fish covering center, fish on pet zone, harsh shadow, low resolution, blurry, sticker overlay, cutout fish, separate floating sticker
```

---

## 三、入库与部署 checklist

1. 将 1 张 PNG 放入 `backend/public/assets/pet-decorations/1024/`
2. 执行 `npm run pet-decorations:generate-400`
3. 执行 `npm run prisma:db:execute:pet-theme-goldfish-express-2026`（会自动停用旧饰品 `acc_theme_goldfish_express_2026`）
4. 上传 `public/assets/pet-decorations/` 到服务器
5. 部署 display-app
6. Display 验证：萌宠档案 → 更换装扮 → **主题** Tab → 「金鱼列车」→ 确认仅装备氛围、无单独饰品

---

## 四、前端元数据（已实现）

| 字段 | 值 |
|------|-----|
| `PET_DECO_THEME_META.goldfish_express_2026.name` | 金鱼列车 |
| `badge` | 治愈 |
| `accent` | `#FF8C42` |
| 饰品层 | 无（`ACC_PLACEMENT` 无条目） |

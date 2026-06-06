# 育英星宠 · 主题皮肤 AI 生成清单

> **用途**：主题皮肤 = **合成氛围（backdrop）+ 饰品** 一套联动，一键装备。  
> **主题**：`ninja_flame_2026` · **火影忍者**（原创忍者村冒险风，**非官方 IP 素材**）  
> **版本**：v1.0（composite backdrop）  
> **素材数量**：2 张（BD + ACC）

---

## 一、主题概念

| 项目 | 值 |
|------|-----|
| theme_group | `ninja_flame_2026` |
| 主题名 | 火影忍者 |
| 上线场景 | 装扮面板「主题」Tab |
| 视觉关键词 | 忍者村、木叶风木屋、鸟居、夕阳、拉面屋、卷轴、苦无、手里剑、热血冒险 |
| 主色 | 忍者橙 `#FF6B35`、深靛 `#1A3A5C`、木叶绿 `#3D8B4E`、原木 `#C4A574`、夕照金 `#FFB347` |
| 风格 | 2D 扁平 + 轻动漫插画，与 campus/star 系列一致 |

**版权与原创要求（必守）**

- **禁止**：《火影忍者》官方角色（鸣人、佐助、小樱等）、官方 Logo、木叶旋涡纹、写轮眼、轮回眼等可识别 IP 符号
- **允许**：通用日式忍者村场景、原创 Q 版忍具、无标识护额、普通鸟居与木屋
- 定位为「忍者热血冒险」**原创致敬风**，非官方联动

**套装组成（composite 模式）**

| 编号 | 文件名 | type | 中文名 | 叠加层 |
|------|--------|------|--------|--------|
| NF-BD | `backdrop_theme_ninja_flame_2026.png` | theme_backdrop | 火影忍者·氛围 | z-index 1 最底 |
| NF-AC | `acc_theme_ninja_flame_2026.png` | accessory | 火影忍者·忍具 | z-index 4 右上饰品 |

**渲染顺序**：backdrop → 宠物 → accessory

**保存路径**

- 源图 1024：`backend/public/assets/pet-decorations/1024/`
- 缩略图 400：运行 `npm run pet-decorations:generate-400`

**系统叠加说明**  
宠物由程序居中偏下插入；backdrop 满幅不透明；饰品为透明 PNG，**苦无+手里剑+小卷轴画在右上区域**，避开萌宠头部。

---

## 二、NF-BD · 火影忍者·氛围（合成 backdrop）

| 项目 | 值 |
|------|-----|
| 导出文件名 | `backdrop_theme_ninja_flame_2026.png` |
| code | `backdrop_theme_ninja_flame_2026` |

**Positive Prompt**

```
Create one mobile game pet profile THEME BACKDROP asset — original cute Japanese ninja village adventure theme (NOT Naruto official art, NOT any copyrighted anime characters or logos).

TECHNICAL REQUIREMENTS:
- Exact canvas size: 1024 x 1024 pixels, square 1:1
- Output: PNG, full opaque image, edge-to-edge fill (NOT transparent)
- sRGB, warm sunset adventure mood, kid-friendly

ART STYLE:
- Cute casual mobile game UI backdrop, 2D flat illustration with light anime influence
- Ninja village street scene: wooden buildings with curved roofs, paper lanterns, small ramen shop sign (generic text-free), stone path
- Background: distant mountains with 3-4 generic stone face monuments (abstract, NOT recognizable characters), orange sunset sky gradient
- Foreground edges: cherry blossom branches, wooden fence, torii gate partial on one side
- Colors: ninja orange #FF6B35, deep indigo #1A3A5C, leaf green #3D8B4E, wood #C4A574, sunset gold #FFB347

COMPOSITION:
- Do NOT draw any character, animal, pet, human, ninja person, trademark logo, leaf-village symbol, sharingan, or official anime reference
- Upper 40%: mountains, sky, distant village rooftops
- Lower 30%: stone path and ground; center-bottom 42% relatively clean for pet overlay (pet stands on path)
- Decorative elements on sides and upper area only — do not clutter pet zone
- Energetic shonen adventure atmosphere, peaceful village at golden hour

MOOD: ninja adventure, friendship, training, warm sunset village
```

**Negative Prompt**

```
Naruto, Sasuke, Sakura, Kakashi, official anime, manga screenshot, Konoha symbol, sharingan, rinnegan, akatsuki, text, watermark, logo, brand, pet, animal, human, face portrait, photorealistic, 3D render, transparent center, cluttered center, horror, blood, weapon pointing at viewer
```

---

## 三、NF-AC · 火影忍者·忍具

| 项目 | 值 |
|------|-----|
| 导出文件名 | `acc_theme_ninja_flame_2026.png` |
| code | `acc_theme_ninja_flame_2026` |

**定位说明**  
程序按 **canvas 角标模式** 叠加，锚点**右上**（`ACC_PLACEMENT.acc_theme_ninja_flame_2026`，`transformOrigin: right top`）。画 **Q 版苦无 + 2 枚手里剑 + 小卷轴**，主体在**画布右上 1/4**，宽约 30%，左下留空给萌宠。

**Positive Prompt**

```
Create one mobile game pet ACCESSORY sticker — cute chibi ninja tools cluster, original design (NOT Naruto official items with logos).

TECHNICAL REQUIREMENTS:
- Exact canvas size: 1024 x 1024 pixels
- Output: PNG with TRANSPARENT background (alpha)
- Single accessory group only, no pet, no human, no village background

ART STYLE:
- 2D flat cute sticker, clean edges, slight anime charm
- One small kunai knife with simple metal gray and orange cord #FF6B35
- Two tiny shuriken stars, metallic gray with soft highlight
- One rolled scroll tied with string, beige paper #E8DCC8
- Optional 2-3 tiny orange sparkle motes for energy feel

COMPOSITION:
- Place tool cluster in UPPER-RIGHT area (top 14-30%, right 6-22% of canvas)
- Cluster width roughly 26-32% of canvas; do NOT center
- Lower 60% and center-left must remain EMPTY transparent for pet below
- No village symbols on forehead protector — if any band shown, keep blank/plain
- Readable at 400px thumbnail

MOOD: ninja tools, training, playful adventure
```

**Negative Prompt**

```
Naruto headband symbol, Konoha leaf, sharingan, character, pet, human, full body, background scene, opaque rectangle, 3D plastic, text, watermark, logo, oversized object covering center, blood, realistic weapon violence
```

---

## 四、入库与部署 checklist

1. 将 2 张 PNG 放入 `backend/public/assets/pet-decorations/1024/`
2. 执行 `npm run pet-decorations:generate-400`
3. 执行 `npm run prisma:db:execute:pet-theme-ninja-flame-2026`
4. 上传 `public/assets/pet-decorations/` 到服务器
5. 部署 display-app
6. Display 验证：萌宠档案 → 更换装扮 → **主题** Tab → 「火影忍者」

---

## 五、前端元数据（已实现）

| 字段 | 值 |
|------|-----|
| `PET_DECO_THEME_META.ninja_flame_2026.name` | 火影忍者 |
| `badge` | 忍者 |
| `accent` | `#FF6B35` |
| `ACC_PLACEMENT` | 右上贴边，`transformOrigin: right top` |

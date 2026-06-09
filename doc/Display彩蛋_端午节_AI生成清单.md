# Display 彩蛋 · 端午节 AI 生成清单

> **用途**：班级大屏节日彩蛋背景（非萌宠主题皮肤）  
> **节日**：`dragon-boat-festival` · 农历五月初五  
> **素材数量**：1 张

## 文件

| 文件名 | 路径 |
|--------|------|
| `bg-dragon-boat-2026.png` | `display-app/web/public/display/images/holidays/dragon-boat/` |

## 2026 彩蛋时段

- **开始**：2026-06-09 00:00（中国时区）
- **结束**：2026-06-20 00:00（不含 6 月 20 日，即 6/9～6/19 有效）
- 配置见 `display-holiday-dates.js` → `DRAGON_BOAT_FESTIVAL_RANGES[2026]`

## 调试

```
?holiday=dragon-boat-festival&holidayDate=2026-06-09
?holiday=dragon-boat-festival&holidayDate=2026-06-19
?holidayDate=2026-06-20   # 应关闭（end 不含当日）
```

## 入库 checklist

1. PNG 放入 `images/holidays/dragon-boat/`
2. 部署 display-app + 同步 holidays 目录
3. 强刷验证过场、开屏 splash、班级页氛围

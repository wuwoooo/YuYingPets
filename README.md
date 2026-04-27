# YuYingPets

`YuYingPets` 现已调整为三部分工程：

- `backend`
  NestJS + Prisma + MySQL + WebSocket 后端服务
- `admin-web`
  React 管理后台
- `display-app`
  独立 Display 应用，一套业务代码同时支持：
  - HTTP 网页部署
  - Windows 安装程序打包

## 目录结构

```text
YuYingPets/
├─ backend/
├─ admin-web/
├─ display-app/
│  ├─ shared/
│  ├─ web/
│  └─ desktop/
└─ doc/
```

## 交付策略

- `admin-web` 只负责后台管理，不参与桌面打包
- `display-app/shared` 放 Display 的 React 页面、状态、接口、WebSocket、业务组件
- `display-app/web` 提供浏览器版入口
- `display-app/desktop` 提供 Windows 桌面壳，后续使用 Electron 打包为安装程序

## 当前状态

- `backend` 已有第一阶段核心接口实现
- `admin-web` 已完成工程骨架初始化
- `display-app` 已完成目录骨架与双形态拆分

## 默认数据部署（后端）

在部署环境完成数据库连接配置后，可在 `backend` 目录执行：

```bash
npm run deploy:seed-default-data
```

该命令会依次执行：

- 规则默认数据导入（`score-rules:import-xls`）
- 萌宠图鉴默认数据导入（`pet-catalog:import`）
- 萌宠图片 URL 后缀迁移为 `.png`（`prisma:db:execute:pet-assets-png`）

# Display E2E

用于 `Display` 原型页的真实端到端回归测试。

## 依赖

在 `display-app` 目录执行：

```bash
npm install
npm --workspace e2e exec playwright install chromium
```

## 前置环境

执行测试前，需要确保以下服务已经启动：

- `backend`: `http://127.0.0.1:3000`
- `display-web`: `http://localhost:5174`

并且本地测试数据库已导入演示数据。

## 可执行脚本

```bash
npm --workspace e2e run test:core
npm --workspace e2e run test:roles
npm --workspace e2e run test:terminal
npm --workspace e2e run test:prototype
npm --workspace e2e run test:realtime
npm --workspace e2e run test:all
```

## 输出

- 控制台会打印每一步结果
- 截图会保存到 `display-app/e2e/artifacts/`

## 说明

- `test:prototype`
  覆盖当前原型页里仍然是前端本地逻辑的“萌宠领养 / 分组管理”
- `test:realtime`
  覆盖后端 WebSocket 事件广播能力
  目前它验证的是后端实时事件是否发出，不代表 Display 前端已经接入自动刷新

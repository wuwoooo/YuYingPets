# display-app/shared

这里预留 Display 端共享业务层：

- React 页面
- 路由
- 状态管理
- API Client
- WebSocket Client
- 业务组件

目标是让网页版和 Windows 桌面版复用同一套 Display 业务代码。

## 当前状态

当前真实 Display 业务尚未迁入 `shared`。`shared/src/index.tsx` 只负责从
React 壳跳转到 `/display/display.html`；`shared/src/api.ts` 是后续共享 API
Client 的雏形，当前静态 Display 页面仍使用 `public/display/scripts/display-app.js`
里的原生请求逻辑。

后续迁移时，应先从 `web/src/display/` 建立稳定模块边界，再评估哪些 API、
类型或组件适合上移到 `shared`。不要假设 `shared` 已经是当前 Display 主业务入口。

# Display 开发与重构指南

## 真实入口

当前真实 Display 页面仍是静态入口：

- `public/display/display.html`
- `public/display/scripts/display-runtime.js`
- `public/display/scripts/display-ui.js`
- `public/display/scripts/display-auth.js`
- `public/display/scripts/display-app.js`
- `public/display/styles/display.css`

`src/main.tsx` 和 `shared/src/index.tsx` 目前只是跳转壳，不是主业务入口。

## 加载顺序

`display.html` 中的脚本必须保持这个顺序：

1. `scripts/pet-colors.js`
2. `scripts/display-runtime.js`
3. `scripts/display-ui.js`
4. `scripts/display-auth.js`
5. `scripts/display-app.js`

`display-runtime.js` 只放低风险运行时能力，例如 URL、资源路径、终端参数、展示性能策略、全屏和桌面端 bridge。
`display-ui.js` 放基础 UI bridge，例如页面激活、底部 Tab 同步、顶部 Toast、实时连接状态条、确认弹窗、提示弹窗和轻量临时 Toast。
`display-auth.js` 放认证权限 bridge，例如角色判断、班级访问判断、解锁续期判断和权限提示文案。
`display-app.js` 继续保留旧全局函数名，避免 HTML 内联 `onclick` 和 E2E 失效。

## 当前模块边界

- `display-runtime.js`
  - 运行时 URL 与资源 URL
  - 终端编号/名称解析
  - 低配模式、网格密度、侧栏折叠等展示偏好存储
  - 显示性能分层与动画/刷新预算
  - HTTP JSON 请求基础层：API base、请求头、JSON payload 校验、网络错误文案
  - 登录账号列表、setup 用户名、持久 token、班级 id 等本地存储适配
  - 节日 splash 播放记录
  - 浏览器全屏
  - Electron 桌面端最小化 bridge
- `display-ui.js`
  - 页面激活与底部 Tab 同步
  - 顶部 `displayToast`
  - 实时连接状态条 DOM 更新
  - 锁定覆盖层 DOM 渲染
  - `confirmModal` 确认/提示弹窗
  - 宠物档案临时 Toast
- `display-auth.js`
  - 角色与班级权限判断
  - 展示端解锁续期判断
  - 锁定、班主任权限提示文案
  - 锁定覆盖层 view model
- `display-app.js`
  - 业务状态 `runtimeState`
  - 登录、终端初始化、班级数据、学生网格、积分、实时连接、工具箱、学情、叫号
  - token 写回、解锁续期、锁定态覆盖层等业务决策
- `display.css`
  - 所有页面和组件样式，仍依赖后置覆盖顺序

## 重构规则

- 每次只迁移一个低耦合能力，保留旧函数名作为包装层。
- 不要一次性删除 HTML 内联 `onclick`。
- 不要把主脚本改成 `type="module"`，除非已同步处理所有旧全局函数。
- 不要在学生网格、实时刷新、工具箱音频、积分操作里引入深拷贝或高频全量 DOM 重绘。
- 新增脚本必须加入 `display-public-guard.mjs` 的必要文件或契约检查。
- 修改加载顺序后必须跑 `npm run check:display` 和 `npm --workspace web run build`。
- 新增本地存储时，优先放入 `DisplayRuntime`，不要在主脚本里直接调用 `localStorage.getItem/setItem/removeItem`。
- 新增低配/标准/高质量模式判断或动画预算时，优先放入 `DisplayRuntime`，主脚本只保留旧函数名包装层。
- 新增通用 HTTP JSON 细节时，优先放入 `DisplayRuntime.fetchApiJson`；不要把 token 写回、解锁续期、锁定态处理下沉到 runtime。
- 新增全局 Toast、Confirm、Alert 这类基础 UI 时，优先放入 `DisplayUI`，主脚本只保留旧函数名包装层。
- 新增页面激活、底部 Tab 同步这类基础导航 DOM 逻辑时，优先放入 `DisplayUI.activatePage`；页面进入后的业务副作用继续留在 `navigateTo`。
- 新增实时连接状态条的 DOM 表现时，优先放入 `DisplayUI.setRealtimeStatus`；Socket 连接、重连、订阅和页面抑制规则继续留在主脚本。
- 新增角色、班级访问、解锁续期纯判断或权限提示文案时，优先放入 `DisplayAuth`；登录流程、token 写回、解锁接口调用继续留在主脚本。
- 新增锁定覆盖层文案/按钮状态时，优先放入 `DisplayAuth.createLockOverlayViewModel`；新增锁定覆盖层 DOM 表现时，优先放入 `DisplayUI.renderLockOverlay`。

## 高风险区域

- 学生卡片网格：依赖 `morphdom`、排序、分组、批量选择和触控手势。
- 实时连接：依赖 Socket.IO、房间订阅、降级刷新和锁定态。
- 工具箱：依赖麦克风权限、AudioContext、RAF、倒计时和低配模式。
- Electron bridge：依赖 preload 注入的 `window.displayDesktop`。
- CSS 后置覆盖：工具箱、叫号遮罩、低配模式、桌面端按钮尤其敏感。

## 推荐迁移顺序

1. localStorage key、运行参数、资源路径等纯工具。
2. API 请求基础层，但保留解锁续期和 token 刷新行为。
3. 页面导航和全局弹窗。
4. 登录/终端初始化。
5. 学生网格和积分操作。
6. 工具箱、学情、叫号等高风险模块。

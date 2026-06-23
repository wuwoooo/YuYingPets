# Display 开发与重构指南

## 真实入口

当前真实 Display 页面仍是静态入口：

- `public/display/display.html`
- `public/display/scripts/display-runtime.js`
- `public/display/scripts/display-ui.js`
- `public/display/scripts/display-auth.js`
- `public/display/scripts/display-holiday-dates.js`
- `public/display/scripts/display-score.js`
- `public/display/scripts/display-realtime.js`
- `public/display/scripts/display-pet-catalog.js`
- `public/display/scripts/display-exchange.js`
- `public/display/scripts/display-leaderboard.js`
- `public/display/scripts/display-honor.js`
- `public/display/scripts/display-student-grid.js`
- `public/display/scripts/display-pet-profile.js`
- `public/display/scripts/display-deco.js`
- `public/display/scripts/display-academic.js`
- `public/display/scripts/display-audio.js`
- `public/display/scripts/display-call.js`
- `public/display/scripts/display-entry-effects.js`
- `public/display/scripts/display-group.js`
- `public/display/scripts/display-settings.js`
- `public/display/scripts/display-app.js`
- `public/display/styles/display.css`
- `public/display/styles/display-classroom-base.css`
- `public/display/styles/display-holiday.css`
- `public/display/styles/display-classroom-shell.css`
- `public/display/styles/display-student-card.css`
- `public/display/styles/display-modal-core.css`
- `public/display/styles/display-sidebar.css`
- `public/display/styles/display-classroom-effects.css`
- `public/display/styles/display-performance.css`
- `public/display/styles/display-entry-transition.css`
- `public/display/styles/display-honor.css`
- `public/display/styles/display-setup-login.css`
- `public/display/styles/display-pet-profile.css`
- `public/display/styles/display-pet-pk.css`
- `public/display/styles/display-group.css`
- `public/display/styles/display-adopt.css`
- `public/display/styles/display-academic.css`
- `public/display/styles/display-exchange.css`
- `public/display/styles/display-leaderboard.css`
- `public/display/styles/display-point-modal.css`
- `public/display/styles/display-classroom-settings.css`
- `public/display/styles/display-toolbox.css`
- `public/display/styles/display-pet-fullview.css`

`src/main.tsx` 和 `shared/src/index.tsx` 目前只是跳转壳，不是主业务入口。

## 加载顺序

`display.html` 中的脚本必须保持这个顺序：

1. `scripts/pet-colors.js`
2. `scripts/display-runtime.js`
3. `scripts/display-ui.js`
4. `scripts/display-auth.js`
5. `scripts/display-holiday-dates.js`
6. `scripts/display-score.js`
7. `scripts/display-realtime.js`
8. `scripts/display-pet-catalog.js`
9. `scripts/display-exchange.js`
10. `scripts/display-leaderboard.js`
11. `scripts/display-honor.js`
12. `scripts/display-student-grid.js`
13. `scripts/display-pet-profile.js`
14. `scripts/display-deco.js`
15. `scripts/display-academic.js`
16. `scripts/display-audio.js`
17. `scripts/display-call.js`
18. `scripts/display-entry-effects.js`
19. `scripts/display-group.js`
20. `scripts/display-settings.js`
21. `scripts/display-app.js`

`display-runtime.js` 只放低风险运行时能力，例如 URL、资源路径、终端参数、展示性能策略、全屏和桌面端 bridge。
`display-ui.js` 放基础 UI bridge，例如页面激活、底部 Tab 同步、登录表单 DOM、setup 步骤 DOM、顶部 Toast、实时连接状态条、确认弹窗、提示弹窗和轻量临时 Toast。
`display-auth.js` 放认证权限 bridge，例如角色判断、班级访问判断、setup 班级筛选、unlock/lock payload 与状态 patch、解锁续期判断和权限提示文案。
`display-holiday-dates.js` 放节日日期、展示配置、URL override 解析和节日文案写入 helper。
`display-score.js` 放积分远端变更、音效抑制、动画行选择和宠物升级队列等纯逻辑。
`display-realtime.js` 放 Socket.IO 事件绑定、班级/display payload 过滤和房间订阅同步。
`display-pet-catalog.js` 放萌宠图鉴、领养图鉴筛选、进化轨道和领养弹窗渲染 bridge。
`display-exchange.js` 放兑换中心状态补丁、学生选项 HTML、确认文案和订单 payload 纯逻辑。
`display-leaderboard.js` 放榜单指标、榜单列表 HTML 和前三名 DOM 写入 bridge。
`display-honor.js` 放荣誉记录归一化、合并、徽章 HTML、荣誉 feed 和跑马灯荣誉行。
`display-student-grid.js` 放学生排序、分组可见索引、批量选择、渲染签名、学生卡片 HTML 和卡片 DOM chrome helper。
`display-pet-profile.js` 放宠物档案命名、昵称输入和历史记录 view helper。
`display-deco.js` 放装饰数组归一化、已知装饰合并、免费规则、排序、饰品定位和装饰图层 helper。
`display-academic.js` 放学情 AI 摘要分行、维度归一化、view model 和 body HTML helper。
`display-audio.js` 放加减分音效、叫号铃声、浏览器音频解锁和音频上下文生命周期。
`display-call.js` 放叫号标题、叫号学生标签渲染和叫号确认按钮 view helper。
`display-entry-effects.js` 放进入页星空、流星重启、进入页动画卸载和轻量 CSS 粒子。
`display-group.js` 放分组管理草稿、分组积分排行、积分记录 HTML、payload、脏检查和学生分组回写等纯逻辑 helper。
`display-settings.js` 放终端设置菜单、设置开关同步等轻量 UI helper。
`display-app.js` 继续保留旧全局函数名，避免 HTML 内联 `onclick` 和 E2E 失效。

## 当前模块边界

- `display-runtime.js`
  - 运行时 URL 与资源 URL
  - 终端编号/名称解析
  - 低配模式、网格密度、侧栏折叠等展示偏好存储
  - 显示性能分层与动画/刷新预算
  - HTTP JSON 请求基础层：API base、请求头、JSON payload 校验、网络错误文案
  - 登录账号列表、setup 用户名、持久 token、班级 id 等本地存储适配
  - 节日体验播放记录
  - 浏览器全屏
  - Electron 桌面端最小化 bridge
- `display-ui.js`
  - 页面激活与底部 Tab 同步
  - 顶部 `displayToast`
  - 实时连接状态条 DOM 更新
  - 锁定覆盖层 DOM 渲染
  - 登录表单、保存账号下拉、密码框清理
  - 终端初始化 setup 步骤切换、模式说明和提示文案 DOM 更新
  - `confirmModal` 确认/提示弹窗
  - 宠物档案临时 Toast
- `display-auth.js`
  - 角色与班级权限判断
  - 终端初始化 setup 班级绑定、年级筛选和班级可选状态纯判断
  - unlock/lock 接口 payload 和锁定/解锁状态 patch 构造
  - 展示端解锁续期判断
  - 锁定、班主任权限提示文案
  - 锁定覆盖层 view model
- `display-holiday-dates.js`
  - 节日日期和展示用日历常量
  - 节日展示配置
  - `holiday` / `holidayDate` URL 参数解析
  - 节日 DOM 文案写入 helper
- `display-score.js`
  - 积分变更 bucket 聚合
  - 积分音效抑制判断
  - 积分动画行、动画时长和低配动画数量预算
  - 宠物升级动画队列输入
- `display-realtime.js`
  - Socket 事件分发
  - 班级事件、display 事件 payload 过滤
  - display/class 房间订阅与取消订阅
- `display-pet-catalog.js`
  - 可领养萌宠离线兜底图鉴
  - 萌宠分类、家族、主题色和阶段归一化
  - 领养弹窗分类筛选、卡片列表和详情进化轨道渲染
  - 旧全局函数包装层仍留在 `display-app.js`
- `display-exchange.js`
  - 兑换弹窗学生列表 HTML
  - 兑换确认弹窗文案
  - `/reward-orders` payload 构造
  - 本地积分扣减补丁
- `display-leaderboard.js`
  - 榜单指标解析
  - 4-10 名 HTML
  - 前三名 DOM 写入 bridge
- `display-honor.js`
  - 荣誉记录 normalize/merge
  - 班级荣誉徽章 HTML
  - 荣誉 feed 与跑马灯荣誉行
- `display-student-grid.js`
  - 排序、分组过滤、批量选择、渲染签名
  - 学生卡片 DOM 主渲染仍留在主脚本
- `display-pet-profile.js`
  - 宠物档案名称、昵称输入、宠物 id、历史记录 helper
  - 档案完整 DOM 渲染与装饰入口仍留在主脚本
- `display-deco.js`
  - 装饰 catalog 归一化与补全
  - 主题免费规则与排序
  - 饰品 code 解析、宠物锚点、装饰 transform 计算
  - 装饰图片预热、装饰层 DOM 同步、学生卡片装饰 HTML
  - 装饰面板完整 DOM 和接口提交仍留在主脚本
- `display-academic.js`
  - 学情 AI 建议分行
  - 学情维度归一化和排序
  - AI 摘要 view model
  - AI 摘要 body HTML helper
  - 学情接口调用、弹窗状态和学生选择仍留在主脚本
- `display-audio.js`
  - 加减分音效
  - 叫号铃声
  - 浏览器音频解锁
  - 音频上下文和叫号铃声 interval 生命周期
- `display-call.js`
  - 叫号标题
  - 叫号学生标签 DOM helper
  - 叫号确认按钮状态 view model
  - 真实接口确认、轮询和 socket 事件处理仍留在主脚本
- `display-entry-effects.js`
  - 进入页星空 DOM 补齐
  - 流星动画重启与卸载
  - 宠物升级轻量 CSS 粒子
- `display-group.js`
  - 分组管理草稿初始化
  - 小组积分排行排序和 HTML
  - 小组积分记录时间格式化和列表 HTML
  - 分组管理列表、学生分组行和下拉选项 HTML
  - 分组保存 payload、脏检查和学生本地分组回写
- `display-settings.js`
  - 设置菜单切换和开关同步
  - 动态 title 清理 observer 仍留在主脚本
- `display-app.js`
  - 业务状态 `runtimeState`
  - 登录、终端初始化、班级数据、学生网格、积分、实时连接、工具箱、学情、叫号
  - token 写回、解锁续期、锁定态覆盖层等业务决策
- `display.css`
  - 全局变量、基础页面和仍未拆出的低风险公共样式
- `display-classroom-base.css`
  - 课堂页面基础变量、网格密度变量、课堂背景和层级基础
- `display-holiday.css`
  - 节日教室皮肤、进入过场覆盖、儿童节/端午覆盖和低配降级
- `display-classroom-shell.css`
  - 课堂顶栏、主内容壳层和课堂工具栏样式
- `display-student-card.css`
  - 学生网格、学生卡片、头像入口、排名和卡片内信息样式
- `display-modal-core.css`
  - 通用 overlay、Confirm、锁定覆盖层、班级选择和基础面板样式
- `display-sidebar.css`
  - 右侧栏、折叠态、排行榜入口卡片和课堂侧栏信息块样式
- `display-classroom-effects.css`
  - 课堂装饰点、排名/入口呼吸动画和拖拽交互动效
- `display-performance.css`
  - 响应式网格变量、标准显示模式和低配模式降级样式
- `display-entry-transition.css`
  - 进入页星空、进入页角标、教师登录入口和进入校园过场样式
- `display-honor.css`
  - 荣誉 feed、班级荣誉徽章和宠物档案荣誉列表样式
- `display-setup-login.css`
  - setup 初始化页、登录页和备案号布局样式
- `display-pet-profile.css`
  - 萌宠档案、装饰面板、学生卡片装饰叠层和档案底部操作按钮样式
- `display-pet-pk.css`
  - 萌宠 PK 拖拽氛围、目标锁定、对战 overlay、演出动画和 PK keyframes
- `display-group.css`
  - 小组管理、小组积分排行、小组积分记录和调整弹窗样式
- `display-adopt.css`
  - 萌宠领养图鉴、宠物详情预览、阶段轨道和领养进化视觉样式
- `display-academic.css`
  - 学情页、学情 AI 弹窗、学情过场和学情低配降级样式
- `display-exchange.css`
  - 积分兑换页、商品卡片、兑换结果弹窗和学生选择样式
- `display-leaderboard.css`
  - 排行榜页、领奖台、榜单列表和榜单导航样式
- `display-point-modal.css`
  - 快捷加减分弹窗、积分浮动、宠物升级/领养演出样式
- `display-classroom-settings.css`
  - 课堂底栏设置按钮、Electron 最小化按钮和设置菜单样式
- `display-toolbox.css`
  - 教室工具箱首页、沉浸页、声浪、安静花园、随机抽选、计时器和工具箱设置样式
- `display-pet-fullview.css`
  - 萌宠档案全屏观看模式样式

## 重构规则

- 每次只迁移一个低耦合能力，保留旧函数名作为包装层。
- 不要一次性删除 HTML 内联 `onclick`。
- 不要把主脚本改成 `type="module"`，除非已同步处理所有旧全局函数。
- 不要在学生网格、实时刷新、工具箱音频、积分操作里引入深拷贝或高频全量 DOM 重绘。
- 新增脚本必须加入 `display-public-guard.mjs` 的必要文件或契约检查。
- 新增或拆分 `public/display/scripts/*.js` 后，必须同时确认根目录 `deploy.sh` 的 display-app staging 会上传并版本化这些资源；部署脚本应从 `display.html` 自动扫描脚本/CSS 引用，不能再维护容易漏项的手写清单。
- 修改脚本加载顺序后必须跑 `npm run check:display`、`npm --workspace web run build`，并用 deploy staging 模拟检查 `display.html` 引用的脚本/CSS 在 staging 目录真实存在。
- Display bridge/helper 源码继续按业务域拆在 `public/display/scripts/*.js`，但生产构建由 Vite 的 `display-bridge-bundle` 插件合并为 `dist/display/scripts/display-bridge-bundle.<hash>.js` 并改写 `dist/display/display.html`；`display-app.js` 主脚本仍保持独立加载。
- 修改 bridge/helper 脚本顺序或新增 bridge/helper 文件时，必须同步 `scripts/display-js-bridge-bundle.mjs` 的 `DISPLAY_BRIDGE_SCRIPT_ORDER`，并确认 `display-public-guard.mjs` 必要文件清单和 API contract 已覆盖。
- Display CSS 源码继续按业务域拆在 `public/display/styles/*.css`，但生产构建由 Vite 的 `display-css-bundle` 插件合并为 `dist/display/styles/display-bundle.<hash>.css` 并改写 `dist/display/display.html`；不要手工编辑构建产物。
- 修改 CSS stylesheet 顺序或新增 CSS 文件时，必须同步 `scripts/display-css-bundle.mjs` 的 `DISPLAY_CSS_ORDER`，并确认 `display-public-guard.mjs` 必要文件清单和 metrics 已覆盖。
- 新增本地存储时，优先放入 `DisplayRuntime`，不要在主脚本里直接调用 `localStorage.getItem/setItem/removeItem`。
- 新增低配/标准/高质量模式判断或动画预算时，优先放入 `DisplayRuntime`，主脚本只保留旧函数名包装层。
- 新增通用 HTTP JSON 细节时，优先放入 `DisplayRuntime.fetchApiJson`；不要把 token 写回、解锁续期、锁定态处理下沉到 runtime。
- 新增全局 Toast、Confirm、Alert 这类基础 UI 时，优先放入 `DisplayUI`，主脚本只保留旧函数名包装层。
- 新增页面激活、底部 Tab 同步这类基础导航 DOM 逻辑时，优先放入 `DisplayUI.activatePage`；页面进入后的业务副作用继续留在 `navigateTo`。
- 新增实时连接状态条的 DOM 表现时，优先放入 `DisplayUI.setRealtimeStatus`；Socket 连接、重连、订阅和页面抑制规则继续留在主脚本。
- 新增角色、班级访问、解锁续期纯判断或权限提示文案时，优先放入 `DisplayAuth`；登录流程、token 写回、解锁接口调用继续留在主脚本。
- 新增锁定覆盖层文案/按钮状态时，优先放入 `DisplayAuth.createLockOverlayViewModel`；新增锁定覆盖层 DOM 表现时，优先放入 `DisplayUI.renderLockOverlay`。
- 新增登录表单、保存账号或 setup DOM 表现时，优先放入 `DisplayUI`；主脚本只保留账号存储、登录提交和业务流转包装层。
- 新增 setup 班级筛选、终端 payload 或 unlock/lock 状态 patch 时，优先放入 `DisplayAuth`；主脚本继续负责实际接口调用、token 写回和状态落地。
- 新增积分变更聚合、动画数量预算、动画行选择或升级队列输入时，优先放入 `DisplayScore`；主脚本继续负责真实 DOM 动画、音效播放和刷新节流。
- 新增 Socket 事件注册、payload 接收过滤或房间订阅同步时，优先放入 `DisplayRealtime`；主脚本继续负责事件处理函数里的业务副作用。
- 新增萌宠图鉴、领养弹窗、进化轨道、图鉴筛选或宠物分类纯逻辑时，优先放入 `DisplayPetCatalog`；主脚本只保留旧全局函数名和领养接口提交。
- 新增加减分音效、叫号铃声或浏览器音频解锁时，优先放入 `DisplayAudio`；主脚本只保留旧全局函数包装。
- 新增叫号展示标题、学生标签或确认按钮 view helper 时，优先放入 `DisplayCall`；主脚本继续负责接口确认、轮询和 socket 事件处理。
- 新增进入页星空、流星、页面动画卸载或轻量 CSS 粒子时，优先放入 `DisplayEntryEffects`。
- 新增分组管理草稿、分组积分排行、积分记录 HTML、保存 payload、脏检查或学生分组本地回写时，优先放入 `DisplayGroup`；主脚本继续负责接口调用、弹窗开关和业务状态刷新。
- 新增教室工具箱配置、范围筛选、抽选 key、工具箱文案写入、格式化或等级判断 helper 时，优先放入 `DisplayToolbox`；主脚本继续负责麦克风、RAF、倒计时状态机和真实 DOM 渲染流程。
- 新增学生排序、学生卡片 DOM key、rank badge、学生卡片 HTML 或学生网格 HTML 时，优先放入 `DisplayStudentGrid`；主脚本继续负责真实数据、morphdom 调用、PK 交互绑定和业务副作用。
- 新增兑换中心、榜单、荣誉、学生网格纯逻辑、宠物档案 helper、装饰纯逻辑、学情 AI 摘要 view helper 或设置 UI helper 时，优先放入对应 `DisplayExchange`、`DisplayLeaderboard`、`DisplayHonor`、`DisplayStudentGrid`、`DisplayPetProfile`、`DisplayDeco`、`DisplayAcademic`、`DisplaySettings`。
- 新增节日日期、节日展示文案、节日 URL override 或节日 DOM 文案写入 helper 时，优先放入 `DisplayHolidayDates`；节日动效只保留进入过场，课堂页不要新增第二套 splash。
- 新增课堂页面基础变量、网格密度变量、课堂背景或课堂层级基础时，优先放入 `display-classroom-base.css`。
- 新增节日教室皮肤、进入过场覆盖、节日卡片覆盖或节日低配降级样式时，优先放入 `display-holiday.css`。
- 新增课堂顶栏、主内容壳层或课堂工具栏样式时，优先放入 `display-classroom-shell.css`。
- 新增学生网格、学生卡片、头像入口、排名或卡片内信息样式时，优先放入 `display-student-card.css`。
- 新增通用 overlay、Confirm、锁定覆盖层、班级选择或基础弹窗面板样式时，优先放入 `display-modal-core.css`。
- 新增右侧栏、侧栏折叠、排行榜入口卡片或课堂侧栏信息块样式时，优先放入 `display-sidebar.css`。
- 新增课堂装饰点、排名呼吸、入口卡片呼吸或拖拽交互动效时，优先放入 `display-classroom-effects.css`。
- 新增响应式网格变量、标准显示模式或低配模式降级样式时，优先放入 `display-performance.css`；如果降级只针对某个已拆分业务域，也可以放入对应业务 CSS。
- 新增进入页星空、进入页角标、教师登录入口或进入校园过场样式时，优先放入 `display-entry-transition.css`。
- 新增 setup/login 样式时，优先放入 `display-setup-login.css`；不要再把这类页面样式写回 `display.css`。
- 新增荣誉 feed、班级荣誉徽章或宠物档案荣誉列表样式时，优先放入 `display-honor.css`。
- 新增萌宠档案、装饰面板或学生卡片装饰叠层样式时，优先放入 `display-pet-profile.css`。
- 新增萌宠 PK 拖拽、目标锁定、PK overlay 或对战演出 keyframes 时，优先放入 `display-pet-pk.css`。
- 新增小组管理、小组积分排行、小组积分记录或调整弹窗样式时，优先放入 `display-group.css`。
- 新增萌宠领养图鉴、领养详情、阶段轨道或领养视觉演出样式时，优先放入 `display-adopt.css`。
- 新增学情页、学情 AI 弹窗或学情低配降级样式时，优先放入 `display-academic.css`。
- 新增积分兑换页、商品卡片、兑换结果弹窗或学生选择样式时，优先放入 `display-exchange.css`。
- 新增排行榜页、领奖台、榜单列表或榜单导航样式时，优先放入 `display-leaderboard.css`。
- 新增快捷加减分弹窗、积分浮动、宠物升级或领养演出样式时，优先放入 `display-point-modal.css`。
- 新增课堂设置按钮、最小化按钮或设置菜单样式时，优先放入 `display-classroom-settings.css`。
- 新增教室工具箱样式时，优先放入 `display-toolbox.css`；不要再写回 `display.css`。
- 新增萌宠全屏观看样式时，优先放入 `display-pet-fullview.css`。
- 新增或拆分 CSS 文件后，必须加入源码 `display.html` 的 preload/stylesheet，并同步 `scripts/display-css-bundle.mjs`，确认 `display-public-guard.mjs` 必要文件清单和 metrics 已覆盖。
- 主脚本不允许出现重复函数名；`display-public-guard.mjs` 会拦截新的重复函数名。后续若需要临时同名局部函数，也应使用有语义的局部名称，避免 AI 误读实际运行版本。

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

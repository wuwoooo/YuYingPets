# display-app/web

这里提供 Display 的 HTTP 网页入口。

运行形态：

- 浏览器访问
- 白板浏览器全屏
- 局域网网页部署

## 当前真实入口

当前 Display 主业务仍在 `web/public/display/` 下以静态页面运行：

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
- `public/display/scripts/display-toolbox.js`
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

`web/src/main.tsx` 目前只负责把访问根路径的用户跳转到
`/display/display.html`，不承载真实 Display 业务逻辑。

`display-runtime.js` 是主脚本渐进重构的运行时 bridge，当前承载运行时 URL、
资源地址、API 请求基础层、全屏和桌面端窗口桥接等低风险工具逻辑。
`display-ui.js` 承载页面激活、底部 Tab 同步、登录表单、setup 步骤、Toast、实时连接状态条、锁定覆盖层、Confirm、Alert 等基础 UI bridge。
`display-auth.js` 承载角色、班级访问、终端初始化筛选、unlock/lock payload 与状态 patch、展示端解锁续期、锁定覆盖层 view model 等认证权限判断。
`display-score.js` 承载积分变更聚合、动画预算、动画行选择和宠物升级队列输入等纯逻辑。
`display-realtime.js` 承载 Socket 事件分发、payload 过滤和房间订阅同步。
`display-pet-catalog.js` 承载萌宠图鉴、领养图鉴筛选、进化轨道和领养弹窗渲染 bridge。
`display-holiday-dates.js` 现在同时承载节日日期、节日展示配置、节日 override 解析和节日文案写入 helper；节日动效只保留进入过场，不再维护课堂页 splash。
`display-exchange.js`、`display-leaderboard.js`、`display-honor.js`、`display-student-grid.js`、`display-pet-profile.js`、`display-deco.js`、`display-academic.js`、`display-audio.js`、`display-call.js`、`display-entry-effects.js`、`display-group.js`、`display-toolbox.js`、`display-settings.js`
分别承载兑换、榜单、荣誉、学生网格/学生卡片渲染 helper、宠物档案 helper、装饰 catalog/定位/图层 helper、学情 AI 摘要 view helper、大屏音效、叫号展示 helper、进入页特效、分组管理纯逻辑、教室工具箱配置/范围/格式化/等级判断 helper 和设置 UI helper。
`display-app.js` 中仍保留旧函数名作为包装层，保证 HTML 内联事件和历史调用不受影响。
`display.css` 只保留全局变量、基础页面和仍未拆出的低风险公共样式。
`display-classroom-base.css` 承载课堂页面基础变量、网格密度变量和课堂背景层级。
`display-holiday.css` 承载节日教室皮肤、进入过场配套覆盖和节日覆盖样式；不要在课堂页新增第二套节日 splash。
`display-classroom-shell.css` 承载课堂顶栏、主内容壳层和课堂工具栏样式。
`display-student-card.css` 承载学生网格、学生卡片、头像入口、排名和卡片内信息样式。
`display-modal-core.css` 承载通用 overlay、Confirm、锁定覆盖层、班级选择和基础面板样式。
`display-sidebar.css` 承载右侧栏、折叠态、排行榜入口卡片和课堂侧栏信息块样式。
`display-classroom-effects.css` 承载课堂装饰点、排名/入口呼吸动画和拖拽交互动效。
`display-performance.css` 承载响应式网格变量、标准显示模式和低配模式降级样式。
`display-entry-transition.css` 承载进入页星空和进入校园过场样式。
`display-honor.css` 承载荣誉 feed、班级荣誉徽章和宠物档案荣誉列表样式。
`display-setup-login.css` 承载 setup 初始化页、登录页和备案号布局样式，避免继续膨胀主 CSS。
`display-pet-profile.css` 承载萌宠档案、装饰面板和学生卡片装饰叠层样式。
`display-pet-pk.css` 承载萌宠 PK 拖拽氛围、目标锁定、对战 overlay、演出动画和 PK keyframes。
`display-group.css` 承载小组管理、小组积分排行、记录和调整弹窗样式。
`display-adopt.css` 承载萌宠领养图鉴、详情预览和进化轨道样式。
`display-academic.css` 承载学情页、学情 AI 弹窗和学情低配降级样式。
`display-exchange.css` 承载积分兑换页、兑换商品卡片、兑换结果弹窗和学生选择样式。
`display-leaderboard.css` 承载排行榜页面、领奖台、榜单列表和榜单导航样式。
`display-point-modal.css` 承载快捷加减分弹窗、积分浮动、宠物升级/领养演出样式。
`display-classroom-settings.css` 承载课堂底栏设置按钮、最小化按钮和设置菜单样式。
`display-toolbox.css` 承载教室工具箱首页、沉浸页、音频工具、抽选和计时器样式。
`display-pet-fullview.css` 承载萌宠档案全屏观看模式样式。

继续开发或重构前，先阅读 `DISPLAY_DEVELOPMENT_GUIDE.md`，里面记录了真实入口、
加载顺序、兼容层规则和高风险区域。

## 构建护栏

`npm run check:display` 会检查真实 Display 静态入口：

- 必要 HTML / JS / CSS 文件是否存在
- `display.html` 引用的相对资源是否存在
- Display 各 bridge 脚本、分组 helper、`display-app.js` 与 `pet-colors.js` 是否能通过浏览器脚本语法解析
- `display.html` 内联 `onclick` 调用的全局函数是否能在 `display-app.js` 中找到
- `DisplayRuntime`、`DisplayUI`、`DisplayAuth`、`DisplayHolidayDates`、`DisplayScore`、`DisplayRealtime`、`DisplayPetCatalog` 是否暴露主脚本依赖的 bridge API
- 主脚本是否继续把登录/setup UI、unlock/lock payload、realtime 事件分发、积分动画队列委托给对应 bridge
- 新增业务 bridge 是否暴露主脚本依赖的 API
- 主脚本是否出现新的重复全局函数名
- Display CSS 的源码加载顺序是否与 Vite CSS bundle 配置一致
- Display bridge/helper 脚本的源码加载顺序是否与 Vite JS bridge bundle 配置一致

`npm run build` 会在 Vite 构建开始时自动执行同一套检查，并在构建结束后把
Display 的拆分 CSS 合并为 `display-bundle.<hash>.css` 写入 `dist/display/styles/`，
把已拆出的 Display bridge/helper 合并为 `display-bridge-bundle.<hash>.js` 写入
`dist/display/scripts/`，同时改写 `dist/display/display.html`。源码仍保留拆分
CSS 和拆分 JS，方便本地直接打开 `public/display/display.html` 和继续按业务域维护；
生产产物只加载单个 Display CSS bundle、单个 bridge/helper JS bundle，以及仍独立的
`display-app.js` 主脚本。

## 后续模块化边界

稳定推进时，优先把以下能力从 `public/display/scripts/display-app.js`
迁入 `src/display/`，并通过兼容层继续暴露旧全局函数：

- API、localStorage key、运行参数
- 基础页面激活、Toast、实时连接状态条、锁定覆盖层、Confirm、Alert 与页面导航
- 认证权限判断、展示端解锁续期判断、锁定覆盖层 view model
- 登录/终端初始化、unlock/lock 状态流转、实时连接事件分发、学生网格、积分操作与动画队列
- 萌宠图鉴、领养图鉴、宠物档案、装饰面板、学情 AI 摘要、叫号展示、音效、进入页特效、分组管理纯逻辑
- 节日皮肤、课堂基础、课堂壳层、学生卡片、通用弹窗、右侧栏、课堂动效、性能降级、进入页/过场、setup/login、荣誉、分组管理、萌宠领养、萌宠档案、萌宠 PK、学情、兑换、排行榜、快捷加减分、课堂设置、工具箱、萌宠全屏观看样式继续放在独立 CSS，主 CSS 只保留基础层和剩余待拆公共样式
- 工具箱、学情、叫号遮罩

在主业务迁入源码前，不要把 `display-app.js` 改成 ES module，也不要删除
HTML 中现有的 `onclick`，以免影响白板浏览器和 Electron 打包回退页。

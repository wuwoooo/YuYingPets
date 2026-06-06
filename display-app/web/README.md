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
- `public/display/scripts/display-app.js`
- `public/display/styles/display.css`

`web/src/main.tsx` 目前只负责把访问根路径的用户跳转到
`/display/display.html`，不承载真实 Display 业务逻辑。

`display-runtime.js` 是主脚本渐进重构的运行时 bridge，当前承载运行时 URL、
资源地址、API 请求基础层、全屏和桌面端窗口桥接等低风险工具逻辑。
`display-ui.js` 承载页面激活、底部 Tab 同步、Toast、实时连接状态条、Confirm、Alert 等基础 UI bridge。`display-app.js`
中仍保留旧函数名作为包装层，保证 HTML 内联事件和历史调用不受影响。

继续开发或重构前，先阅读 `DISPLAY_DEVELOPMENT_GUIDE.md`，里面记录了真实入口、
加载顺序、兼容层规则和高风险区域。

## 构建护栏

`npm run check:display` 会检查真实 Display 静态入口：

- 必要 HTML / JS / CSS 文件是否存在
- `display.html` 引用的相对资源是否存在
- `display-runtime.js`、`display-ui.js`、`display-app.js` 与 `pet-colors.js` 是否能通过浏览器脚本语法解析
- `display.html` 内联 `onclick` 调用的全局函数是否能在 `display-app.js` 中找到
- `DisplayRuntime`、`DisplayUI` 是否暴露主脚本依赖的 bridge API

`npm run build` 会在 Vite 构建开始时自动执行同一套检查。这个阶段不改变运行时
产物路径，也不迁移主业务逻辑；它只是先让构建过程感知真实 Display 静态入口。

## 后续模块化边界

稳定推进时，优先把以下能力从 `public/display/scripts/display-app.js`
迁入 `src/display/`，并通过兼容层继续暴露旧全局函数：

- API、localStorage key、运行参数
- 基础页面激活、Toast、实时连接状态条、Confirm、Alert 与页面导航
- 登录/终端初始化、实时连接、学生网格、积分操作
- 工具箱、学情、叫号遮罩

在主业务迁入源码前，不要把 `display-app.js` 改成 ES module，也不要删除
HTML 中现有的 `onclick`，以免影响白板浏览器和 Electron 打包回退页。

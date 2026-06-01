# display-app/desktop

这里放 `育英星宠 Display` 的 Electron 桌面壳。

当前约定：

- 开发态通过 `DISPLAY_WEB_URL` 加载本地运行中的 `display-app/web`
- 生产态优先读取 `DISPLAY_START_URL` / `display.config.json` 指向线上页面
- 若未配置线上地址，则回退到 `../web/dist/index.html`
- 可通过 `DISPLAY_FULLSCREEN=true` 进入全屏展示模式
- 使用 `electron-builder` 输出 Windows 安装程序
- 启动时默认清理 Electron 网络缓存与 Service Worker 缓存

命令说明：

- `npm run dev`
  使用默认开发地址 `http://localhost:5174`
- `npm run dev:kiosk`
  使用开发地址并直接全屏
- `npm run start`
  直接以生产模式启动桌面壳，要求 `display-app/web/dist` 已存在
- `npm run build`
  先构建 `display-app/web`
- `npm run pack`
  构建当前平台的 unpacked 桌面产物，用于验证打包配置
- `npm run dist:win`
  生成 Windows NSIS 安装包，要求宿主机具备对应构建环境

配置说明：

- 可在应用同目录放置 `display.config.json`
- 示例文件见 `display.config.example.json`
- 字段：
  - `startUrl`
    线上展示页地址，应用启动时优先加载
  - `fullscreen`
    是否全屏启动，默认 `true`
  - `clearCacheOnLaunch`
    是否在启动时清理 Electron 的 HTTP 缓存与 Service Worker 缓存，默认 `true`

注意：

- 当前清理的是 Electron 自己的浏览器缓存，不是 Windows 系统级缓存
- 不会清空 `localStorage`，避免把终端标识或本地登录态一并删掉
- 如果线上页面打开失败，会落到本地提示页，方便排查网络或服务问题

后续施工项：

- 补设备号、班级号、本地配置文件
- 增加开机启动与白板 kiosk 模式配置
- 补应用图标、安装页资源、自动更新策略

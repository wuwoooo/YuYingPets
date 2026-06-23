# display-app/desktop

这里放 `育英星宠 Display` 的 Electron 桌面壳。

当前约定：

- 开发态通过 `DISPLAY_WEB_URL` 加载本地运行中的 `display-app/web`
- 生产态优先读取 `DISPLAY_START_URL` / `display.config.json` 指向线上页面
- 打包版未配置 `startUrl` 时默认加载 `https://www.dlbfyy.cn/display/display.html`
- 线上展示页加载失败时，回退到安装包内置的 `resources/web/dist/display/display.html`
- 开发态未配置线上地址时回退到 `../web/dist/display/display.html`
- 可通过 `DISPLAY_FULLSCREEN=true` 进入全屏展示模式
- 使用 `electron-builder` 输出 Windows 安装程序
- 启动时默认清理 Electron 网络缓存与 Service Worker 缓存
- Windows 下默认启用系统悬浮小球，主窗口不在前台时点击小球可从其他应用或演示全屏中唤出主窗口

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
- `npm run dist:win:cn`
  使用 npmmirror 的 Electron 与 electron-builder-binaries 镜像生成 Windows x64 NSIS 安装包，适合国内网络环境
- `npm run dist:win:cn:arm64`
  使用国内镜像生成 Windows arm64 NSIS 安装包

自动更新发布流程：

如果打包在 Windows 机、上传在当前 Mac 机，推荐拆成两步：

1. 在 Windows 打包机执行：

`powershell -ExecutionPolicy Bypass -File .\build-display-desktop.ps1`

默认行为：

- 自动把 `desktop/package.json` 版本号做 `patch` 递增
- 执行 `npm run dist:win:cn --workspace desktop`
- 校验 `desktop/release/` 中的 `latest.yml`、`Setup.exe`、`Setup.exe.blockmap`

常见示例：

- `powershell -ExecutionPolicy Bypass -File .\build-display-desktop.ps1`
  自动递增 patch 版本并打包
- `powershell -ExecutionPolicy Bypass -File .\build-display-desktop.ps1 -Version minor`
  自动递增 minor 版本并打包
- `powershell -ExecutionPolicy Bypass -File .\build-display-desktop.ps1 -Version 0.1.3`
  直接设置目标版本号并打包

2. 把 `desktop/release/` 中的三个文件拷回当前 Mac，再在仓库根目录执行：

`SKIP_BUILD=1 ./deploy-display-desktop.sh current`

默认行为：

1. 保持当前 `desktop` 版本号不变
2. 不重新打包，只上传 `desktop/release/` 中的 `latest.yml`、`Setup.exe`、`Setup.exe.blockmap`
3. 自动创建服务器目录 `/www/wwwroot/yuyingpets/static-download/display-app/win/`（如果不存在）
4. 校验 `latest.yml` 与安装包 URL 可访问

常见示例：

- `SKIP_BUILD=1 ./deploy-display-desktop.sh current`
  不重新打包，只把当前 `release/` 里的文件上传

已安装的客户端启动后会延迟检查更新；发现新版本后后台下载，下载完成后提示是否立即重启安装

配置说明：

- 可在应用同目录放置 `display.config.json`
- 示例文件见 `display.config.example.json`
- 字段：
  - `startUrl`
    线上展示页地址，应用启动时优先加载。打包版默认 `https://www.dlbfyy.cn/display/display.html`
  - `apiBaseUrl`
    本地打包页面请求后端 API 的地址，例如 `https://www.dlbfyy.cn/api/v1`。打包版默认使用 `https://www.dlbfyy.cn/api/v1`，可通过该字段覆盖
  - `realtimeUrl`
    实时服务地址，例如 `https://www.dlbfyy.cn`。不配置时默认从 `apiBaseUrl` 去掉 `/api/v1`
  - `fullscreen`
    是否全屏启动，默认 `true`
  - `clearCacheOnLaunch`
    是否在启动时清理 Service Worker 与 CacheStorage 缓存，默认 `true`。HTTP 缓存（图片等静态资源）始终保留以加快启动速度
  - `autoUpdate`
    是否启用桌面壳自动更新，打包版默认 `true`
  - `autoUpdateUrl`
    自动更新目录，默认 `https://www.dlbfyy.cn/download/display-app/win/`
  - `autoUpdateCheckIntervalMinutes`
    自动更新检查间隔，默认 `360` 分钟；启动后也会延迟检查一次
  - `floatingBall`
    是否启用悬浮小球。默认仅 Windows 启用；macOS 开发态可用环境变量 `DISPLAY_FLOATING_BALL=true` 临时打开
  - `floatingBallSize`
    悬浮小球尺寸，范围 48-120，默认 `72`
  - `floatingBallPosition`
    悬浮小球位置，可用 `right-bottom`、`right-top`、`left-bottom`、`left-top`，也可传 `{ "x": 100, "y": 100 }`
  - `floatingBallAlwaysOnTopLevel`
    悬浮小球置顶层级，默认 `screen-saver`
  - `summonedWindowAlwaysOnTop`
    通过悬浮小球唤出主窗口后，主窗口是否保持置顶。Windows 默认 `true`
  - `summonedWindowAlwaysOnTopLevel`
    被唤出主窗口的置顶层级，默认 `screen-saver`

注意：

- 当前清理的是 Electron 自己的浏览器缓存，不是 Windows 系统级缓存
- 不会清空 `localStorage`，避免把终端标识或本地登录态一并删掉
- 打包版默认加载线上 Display 页面，因此只修改并部署 `display-app/web` 时，Windows 安装包通常不需要重新打包
- 自动更新只用于 Electron 桌面壳更新；只改线上 Display Web 功能时，部署服务器静态文件即可
- 如果线上页面打开失败，会回退到安装包内置本地页面，方便断网或服务器异常时保留基础展示能力
- 内置本地页面默认连接 `https://www.dlbfyy.cn/api/v1`；如果服务器域名变化，再在 exe 同目录放置 `display.config.json` 并配置 `apiBaseUrl`
- 自动更新依赖 `latest.yml` 与安装包文件同目录可访问；漏传 `latest.yml` 时客户端会记录更新检查失败
- 正式大规模部署建议补代码签名证书，降低 Windows SmartScreen 或安全策略拦截安装/更新的概率
- 运行日志写入 `%APPDATA%\育英星宠 Display\logs\main.log`
- 悬浮小球依赖 Windows 普通桌面窗口层级；PPT/WPS 演示全屏通常可覆盖显示，但 UAC 安全桌面、锁屏、部分独占全屏或厂商白板壳可能会阻止普通应用置顶，需要在目标教室机实测
- 系统悬浮小球只负责后台唤醒：主窗口获得焦点后会隐藏，主窗口失焦或最小化后显示
- 主窗口前台时，页面右下角会显示桌面端控制气泡；点击后可操作最小化、最大化/还原、全屏/窗口模式、退出
- 桌面端快捷键：`Ctrl+M` 最小化，`Ctrl+Shift+M` 最大化/还原，`F11` 全屏/窗口模式切换

后续施工项：

- 补设备号、班级号、本地配置文件
- 增加开机启动与白板 kiosk 模式配置
- 补应用图标、安装页资源、自动更新策略

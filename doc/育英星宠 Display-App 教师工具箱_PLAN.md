# Display-App 教师工具箱 V1.2 开发计划（含童话自然风氛围素材）

## Summary
按“大屏本地”范围实现教师工具箱，并新增一组“童话自然风”图片资产增强课堂氛围。首版生成 8-12 张素材：4 张工具专属 16:9 背景图 + 8 张透明装饰素材，用于声浪活力、安静花园、幸运抽选、课堂计时器的页面背景、完成反馈和动效装饰。

## Key Changes
- 在 `display-app/web/public/display/display.html` 新增“教师工具箱”入口与 `page-toolbox` 页面，入口与荣耀排行榜、积分兑换、学业成长同级。
- 在 `display-app/web/public/display/scripts/display-app.js` 扩展导航、工具箱运行态、麦克风采样、抽选、计时器、离页资源清理。
- 在 `display-app/web/public/display/styles/display.css` 新增工具箱页面样式，融合现有深蓝校园体系与童话自然风图片资产。
- 新增素材目录：`display-app/web/public/display/images/toolbox/`，所有项目引用图片必须保存到该目录，不引用生成工具默认目录。
- 不新增后端 API、不上传声音、不保存音频、不做活动记录沉淀。

## Image Assets
- 生成 4 张 1920x1080 背景图，建议输出 WebP/JPG：
  - `toolbox-energy-bg.webp`：声浪活力，童话森林课堂、发光能量球、晨读星光、温暖但仍兼容深蓝 UI。
  - `toolbox-garden-bg.webp`：安静花园，宁静花园、花朵树木、蝴蝶、柔和晨光。
  - `toolbox-lucky-bg.webp`：幸运抽选，童话转盘/星光抽签盒、彩带、萌宠陪伴感。
  - `toolbox-timer-bg.webp`：课堂计时器，童话钟塔/沙漏、星尘、温暖倒计时氛围。
- 生成 8 张透明 PNG 装饰素材：
  - `energy-orb.png`、`energy-sparkles.png`
  - `quiet-flower.png`、`quiet-butterfly.png`
  - `lucky-ticket.png`、`lucky-ribbon.png`
  - `timer-hourglass.png`、`timer-stars.png`
- 图片生成使用内置 `image_gen`；透明素材先生成纯色 chroma-key 背景，再本地去背为 PNG alpha。
- 所有素材需压缩并控制体积：背景单张目标小于 600KB，透明装饰单张目标小于 250KB；低配模式下减少背景滤镜和装饰动画。

## Functional Spec
- 声浪活力：
  - 使用 `navigator.mediaDevices.getUserMedia({ audio: true })` + `AudioContext/AnalyserNode` 只计算声音能量。
  - 支持早读模式、小组 PK、欢呼挑战。
  - 早读模式展示能量球、实时活力值、等级和目标达成庆祝动画。
- 安静花园：
  - 复用本地声音采样；安静时成长，嘈杂时暂停并提示保持安静。
  - 达成连续安静目标后展示完整花园。
- 幸运抽选：
  - 支持全班随机、小组随机、重复/不重复模式。
  - 使用前端 `students` 与 `runtimeState.groups`，不依赖新接口。
- 课堂计时器：
  - 支持 1、3、5、10 分钟和自定义时间。
  - 支持开始、暂停、继续、重置，结束时展示视觉提醒和轻量提示音。
- 隐私与资源释放：
  - 禁止 `MediaRecorder`、音频 Blob、音频上传、音频本地存储。
  - 切页、停止工具、退出登录、页面卸载时停止麦克风 track、断开 audio node、取消 RAF/interval/timer。

## Test Plan
- 构建检查：`npm --workspace web run build`。
- 新增 E2E：`display-toolbox.mjs`，覆盖入口、四个工具页面、抽选模式、计时器状态、麦克风 mock、拒绝麦克风权限。
- 手工验收：
  - 首次声音工具弹出麦克风授权。
  - 拒绝权限时只影响声浪/花园，不影响抽选/计时。
  - 离开声音工具后浏览器麦克风占用标识消失。
  - 1920 大屏下图片不糊、不压字、不干扰核心操作按钮。
  - 低配模式下动效降级且页面不卡顿。

## Assumptions
- 首版美术方向锁定为“童话自然风”，但色彩需兼容现有深蓝校园大屏和育英校徽红蓝体系。
- 首版资产规模锁定为 12 张以内：4 张背景 + 8 张透明装饰。
- 生成图不包含复杂文字，避免 AI 图片文字失真；所有标题、按钮、分数、说明文字仍由 HTML/CSS 渲染。

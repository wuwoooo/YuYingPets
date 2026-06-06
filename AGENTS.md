始终使用中文简体回复。

# YuYingPets 仓库约束

- 唯一允许操作的活跃仓库路径：`/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets`
- `/Users/wuwoo/Desktop/work/_育英星宠/archive/YuYingPets-clean-backup_ARCHIVE_READONLY`、`/Users/wuwoo/Desktop/work/_育英星宠/archive/YuYingPets_260523_ARCHIVE_READONLY` 以及 `archive/` 下其他历史目录全部视为归档区，禁止在其中开发、提交、切分支、拉取或推送。
- 未经用户明确要求，禁止执行任何 Git 变更操作，包括但不限于：`git pull`、`git fetch`、`git switch`、`git checkout`、`git merge`、`git rebase`、`git reset`、`git stash pop`、`git remote set-url`、`git remote rename`、`git push`。
- 若任务涉及 Git，先输出并核对以下命令结果，再决定是否继续：
  - `pwd`
  - `git rev-parse --show-toplevel`
  - `git branch --show-current`
- 日常备份只能使用仓库根目录的 `./backup-to-github.sh`。
- 需要恢复历史代码时，先把远程或归档仓库克隆到临时目录对比，再手动挑选文件恢复；禁止在主工作仓库直接 `pull` 回旧代码。

# 项目历史证据根

- `/Users/wuwoo/Desktop/work/_育英星宠` 与当前活跃仓库属于同一项目历史上下文。
- 日常开发写入仍只允许在 `/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets`。
- 父目录下 `pets/`、`scripts/`、`generated_pets_staging/`、`prototype/`、`doc/`、`.cache/` 可作为只读历史证据。
- 父目录 `archive/` 仍为只读归档区，禁止开发、提交、切分支、拉取或推送；需要恢复历史代码时仍按上方历史恢复规则执行。
- 涉及宠物素材、AI 图片、原型、早期产品方案时，必须先检查父目录历史证据，避免重复造流程。

# 复杂任务完成质量规则

- 对跨模块、前端视觉、Display-App、大屏、AI 素材、数据修复、部署相关任务，完成前必须产出简短回执，至少包含：目标、改动路径、验证方式、验证结果、未验证项、风险、下一步。
- 不得把文件数量、目录数量、mock、dry-run、草案、只读扫描写成真实完成。
- 若验证依赖外部账号、真实服务、数据库、生产环境或高风险操作，先用本地证据、fixture、mock 做半真实验证，并明确标记 `semireal_validation`。
- UI、前端、大屏任务若需要视觉质量，优先使用 Browser/in-app browser 或 Playwright 打开本地页面并截图；不能打开时说明原因。
- AI 图片或素材任务必须检查：文件名、尺寸、透明通道、safe zone、保存路径、前端引用、SQL/manifest 一致性。未检查不得写“验收通过”。
- 复杂任务可按串行 worker 模拟执行：Research、Evidence、Planning、Execution、Review、Validator、Integration、Receipt。小任务不强制启用。
- 生成 candidate 时只写入候选目录，不覆盖正式 skill、正式配置或正式项目规则。
- 对历史反复出现的问题，应把修复方式沉淀到 skill candidate、validator candidate 或 AGENTS patch candidate，而不是只在回执中提醒。

# YuYingPets Display-App 验收规则

- Display-App 页面功能完成后，至少检查入口可达、核心状态、异常状态、资源清理、1920 大屏布局、低配或降级策略。
- 涉及麦克风或本地权限时，不上传、不保存音频；离页必须停止 track、断开 audio node、取消 RAF/interval/timer。
- 若使用 mock 权限拒绝或 file:// 本地页面测试，回执中标为半真实验证。

# 宠物素材流水线回执规则

- 回执必须区分：生成队列、raw 结果、透明图、QC、修复、入库、前端显示。
- 至少引用 generation_status、semantic_qc、noise_qc、repair_report 中可用的报告。
- strict QC、island noise QC、semantic QC 结论不一致时，必须解释各自指标含义。

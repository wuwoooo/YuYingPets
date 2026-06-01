# YuYingPets Git 操作规范

## 唯一活跃仓库

- 活跃开发仓库固定为：`/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets`
- 工作区内其他历史仓库和快照目录只允许查看，不允许开发。
- 当前已归档的历史 Git 仓库：
  - `/Users/wuwoo/Desktop/work/_育英星宠/archive/YuYingPets-clean-backup_ARCHIVE_READONLY`
  - `/Users/wuwoo/Desktop/work/_育英星宠/archive/YuYingPets_260523_ARCHIVE_READONLY`

## 唯一工作分支

- 日常开发只允许在 `main` 分支进行。
- `backup/stable` 只保留为历史概念，不再继续使用。

## 远程仓库定位

- 远程只作为手动备份目标，不作为真相源。
- 唯一远程名为 `backup-origin`。
- 禁止把远程仓库当成同步入口使用，尤其禁止使用 `git pull` 试图“修复”当前代码。

## 唯一备份入口

- 日常备份只允许使用：`./backup-to-github.sh`
- 该脚本只会做本地提交和 `push`，不会执行 `pull`、`fetch`、`merge`、`rebase`。
- 运行前必须确认当前路径是主仓库根目录，当前分支是 `main`。

## 恢复旧代码的唯一方式

1. 在临时目录中单独克隆远程备份仓库，或进入 `archive/` 下的历史归档仓库。
2. 仅对比需要恢复的文件。
3. 手动把目标文件复制回主工作仓库。
4. 在主工作仓库中自行检查和提交。

禁止在主工作仓库直接执行 `git pull`、`git checkout <旧提交>` 或把整批旧代码覆盖回来。

## AI / 自动化工具约束

- AI 工具只能在 `/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets` 内工作。
- 遇到多个相似目录时，默认其他目录都是归档。
- 涉及任何 Git 操作前，必须先核对：
  - `pwd`
  - `git rev-parse --show-toplevel`
  - `git branch --show-current`

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

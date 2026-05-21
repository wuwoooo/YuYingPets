# 业务数据清理说明

本文档说明 `backend` 目录下的业务数据清理脚本用法。

## 目标

清理教师、学生、课表、成绩、积分等业务数据，同时保留以下基础配置：

- 学校
- 学期
- 角色
- 年级配置
- 积分规则
- 荣誉定义
- 奖励定义
- 展示配置
- 萌宠目录
- 系统管理员账号

## 命令位置

脚本文件：

- [scripts/reset-business-data.ts](/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets/backend/scripts/reset-business-data.ts)

在 `backend` 目录执行：

```bash
cd /Users/wuwoo/Desktop/work/_育英星宠/YuYingPets/backend
```

## 常用命令

清空全部业务数据：

```bash
npm run reset:business
```

只清空教师：

```bash
npm run reset:teachers
```

只清空学生：

```bash
npm run reset:students
```

只清空班级：

```bash
npm run reset:classes
```

只清空课表：

```bash
npm run reset:schedules
```

只清空积分：

```bash
npm run reset:scores
```

只清空成绩：

```bash
npm run reset:academics
```

## 按模块组合清理

如果需要一次清理多个模块，可使用 `--only` 参数：

```bash
npm run reset:business -- --only=teachers,schedules,scores
```

支持的模块：

- `teachers`：教师账号、教师权限范围、教师任教关系
- `students`：学生、学生画像、学生分组
- `classes`：班级及其级联业务数据
- `schedules`：教师课表、待匹配课表、展示解锁会话
- `scores`：积分记录、班级积分记录
- `academics`：考试与成绩
- `pets`：学生星宠与升级记录
- `honors`：荣誉发放记录
- `rewards`：奖励兑换记录
- `insights`：AI 快照、教师观察
- `logs`：操作日志

## 联动规则

- `classes` 会自动联动清空：
  - `students`
  - `schedules`
  - `scores`
  - `academics`
  - `pets`
  - `honors`
  - `rewards`
  - `insights`

原因是这些模块依赖班级主数据，单删班级会触发外键问题。

## 风险提示

- 这些命令会直接修改当前 `DATABASE_URL` 指向的数据库。
- 执行前先确认当前环境是不是你要操作的库。
- 清理后数据不可恢复，除非你提前做了数据库备份。
- `teachers` 会停用非系统管理员账号，并清掉其手机号、邮箱、职务标签，同时把旧用户名改写为归档用户名，避免后续重新导入时因为唯一索引冲突而自动追加 `2/3/...`。
- `classes` 会删除全部班级，因此后续通常需要重新导入班级、学生、教师范围和课表。

## 帮助命令

查看脚本内置帮助：

```bash
npm run reset:business -- --help
```

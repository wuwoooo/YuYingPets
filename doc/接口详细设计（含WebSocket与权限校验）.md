# 育英星宠接口详细设计（含 WebSocket 与权限校验）

版本：V1.0  
日期：2026-04-14  
适用范围：第一阶段后端与前端联调

## 1. 目标

本文件定义：

- HTTP API 分组与核心字段
- WebSocket 事件协议
- 关键权限校验规则
- Admin / Display 双端如何共用同一套业务接口

说明：

- 本文以 `REST API + WebSocket` 为基础
- 后端建议框架：`NestJS`
- 鉴权建议：`JWT + RBAC + 数据范围校验`

## 2. 接口设计原则

- 所有写操作由服务端统一校验并落日志
- Admin 与 Display 共用同一业务接口，不分别造两套规则
- Display 端的快捷操作，本质仍是标准业务写接口
- 所有实时展示变化都由服务端广播，不由前端自行推导

第一阶段实现约束：

- 积分规则只支持固定分值
- Display 教师解锁时长固定 `15 分钟`
- 兑换即时生效且默认已领取
- AI 学情快照仅支持手动生成

## 3. 通用约定

## 3.1 基础前缀

```text
/api/v1
```

## 3.2 认证头

```text
Authorization: Bearer <token>
```

## 3.3 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

## 3.4 失败响应

```json
{
  "code": 40301,
  "message": "无权操作当前班级",
  "data": null
}
```

## 3.5 典型错误码建议

| 错误码 | 说明 |
|---|---|
| 40001 | 参数错误 |
| 40101 | 未登录 |
| 40102 | token 已失效 |
| 40301 | 无权访问当前数据 |
| 40302 | 当前角色不允许该操作 |
| 40303 | Display 当前未解锁操作模式 |
| 40401 | 资源不存在 |
| 40901 | 状态冲突 |
| 42201 | 规则不可用 |

## 4. 权限模型

## 4.1 角色能力结论

已确认：

- 班主任
  - Admin：可完整管理本班
  - Display：可加减分、可领养、可兑换
- 任课教师
  - Admin：可对授课班级评价
  - Display：可对授课班级加减分
  - 不可兑换
- 展示端账号
  - Display：只展示，不允许写入

## 4.2 权限校验层次

每个写接口必须经过 3 层校验：

1. 登录身份校验
2. 角色权限校验
3. 数据范围校验

例如：

- 任课教师可以调用 `POST /score-records`
- 但只能操作其授权班级
- 调用 `POST /reward-orders` 时应直接拒绝

## 4.3 Display 解锁校验

Display 写操作额外需要：

- 当前终端已进入教师操作模式
- 解锁教师与 token 用户一致
- 解锁未超时

否则返回：

```json
{
  "code": 40303,
  "message": "展示端未解锁教师操作模式"
}
```

## 5. 认证与会话接口

## 5.1 登录

`POST /api/v1/auth/login`

用途：

- Admin 登录
- Display 教师登录

请求示例：

```json
{
  "username": "zhong_9201",
  "password": "******",
  "terminalType": "display"
}
```

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": 101,
      "name": "钟老师",
      "roleCode": "homeroom_teacher"
    },
    "scopes": [
      {
        "scopeType": "class",
        "classId": 2001
      }
    ]
  }
}
```

权限：

- 公共接口

## 5.2 当前用户信息

`GET /api/v1/auth/me`

用途：

- 前端获取当前登录用户与权限范围

## 5.3 登出

`POST /api/v1/auth/logout`

## 6. Display 解锁接口

## 6.1 进入教师操作模式

`POST /api/v1/display/unlock`

用途：

- 将当前 Display 从纯展示模式切换到教师操作模式

请求：

```json
{
  "classId": 2001,
  "displayTerminalCode": "display-9-2-01"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "unlockSessionId": 9001,
    "expiredAt": "2026-04-14T15:00:00+08:00"
  }
}
```

权限：

- `homeroom_teacher`
- `subject_teacher`

额外校验：

- 用户必须在该班级授权范围内

第一阶段约束：

- 解锁时长固定 `15 分钟`
- 接口不接收前端自定义时长参数

## 6.2 查询当前解锁状态

`GET /api/v1/display/unlock-status?classId=2001&displayTerminalCode=display-9-2-01`

## 6.3 主动锁定

`POST /api/v1/display/lock`

## 7. 学校与学期接口

## 7.1 获取学校信息

`GET /api/v1/schools/current`

## 7.2 更新学校信息

`PUT /api/v1/schools/current`

权限：

- `super_admin`
- `school_admin`

## 7.3 学期列表

`GET /api/v1/semesters`

## 7.4 创建或更新学期

- `POST /api/v1/semesters`
- `PUT /api/v1/semesters/:id`

权限：

- `super_admin`
- `school_admin`

## 8. 班级与学生接口

## 8.1 班级列表

`GET /api/v1/classes`

支持参数：

- `semesterId`
- `gradeCode`
- `keyword`
- `status`

权限：

- Admin 登录用户按数据范围过滤

## 8.2 班级详情

`GET /api/v1/classes/:id`

## 8.3 创建班级

`POST /api/v1/classes`

权限：

- `school_admin`
- `grade_admin`

## 8.4 更新班级

`PUT /api/v1/classes/:id`

权限：

- `school_admin`
- `grade_admin`
- `homeroom_teacher` 仅限编辑本班非全局字段时可细分控制

## 8.5 学生列表

`GET /api/v1/students`

支持参数：

- `classId`
- `keyword`
- `status`

## 8.6 学生详情

`GET /api/v1/students/:id`

返回建议包含：

- 基础信息
- 成长档案
- 行为统计
- 萌宠信息
- 荣誉记录
- 兑换记录
- AI 摘要

## 8.7 批量导入学生

`POST /api/v1/students/import`

权限：

- `school_admin`
- `grade_admin`
- `homeroom_teacher`

## 9. 积分规则接口

## 9.1 规则列表

`GET /api/v1/score-rules`

支持参数：

- `moduleType`
- `subjectCode`
- `sceneCode`
- `displayEnabled`
- `keyword`

用途：

- Admin 规则管理
- Display 加减分规则加载

## 9.2 规则详情

`GET /api/v1/score-rules/:id`

## 9.3 新建规则

`POST /api/v1/score-rules`

权限：

- `school_admin`
- `moral_admin`

## 9.4 更新规则

`PUT /api/v1/score-rules/:id`

权限：

- `school_admin`
- `moral_admin`

## 9.5 启停规则

`POST /api/v1/score-rules/:id/toggle`

## 10. 积分评价接口

这是最核心的一组接口，Admin 与 Display 都统一走这里。

## 10.1 单人评价

`POST /api/v1/score-records`

请求：

```json
{
  "classId": 2001,
  "studentId": 3001,
  "ruleId": 5001,
  "remark": "课堂表现很好",
  "sourceTerminal": "display"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "scoreRecordId": 8001,
    "studentProfile": {
      "studentId": 3001,
      "currentScore": 132,
      "currentPetLevel": 2
    },
    "petUpgrade": {
      "upgraded": false
    }
  }
}
```

权限：

- `homeroom_teacher`
- `subject_teacher`

校验规则：

- Display 下必须已解锁教师操作模式
- 班主任可对本班操作
- 任课教师仅可对授课班级操作

## 10.2 批量评价

`POST /api/v1/score-records/batch`

请求：

```json
{
  "classId": 2001,
  "studentIds": [3001, 3002, 3003],
  "ruleId": 5001,
  "remark": "课堂整体表现优秀",
  "sourceTerminal": "display"
}
```

权限：

- `homeroom_teacher`
- `subject_teacher`

## 10.3 按组评价

`POST /api/v1/score-records/group`

请求：

```json
{
  "classId": 2001,
  "classGroupId": 4002,
  "ruleId": 5002,
  "remark": "第二组合作表现突出",
  "sourceTerminal": "display"
}
```

## 10.4 查询积分记录

`GET /api/v1/score-records`

支持参数：

- `classId`
- `studentId`
- `subjectCode`
- `sceneCode`
- `startDate`
- `endDate`

## 10.5 撤销或修正评价

`POST /api/v1/score-records/:id/reverse`

说明：

- 第一阶段可保留此接口给 Admin 使用
- 不建议在 Display 开放

权限：

- `homeroom_teacher`
- `grade_admin`
- `school_admin`

## 11. 分组接口

## 11.1 获取班级分组

`GET /api/v1/classes/:id/groups`

## 11.2 更新学生分组

`PUT /api/v1/classes/:id/groups/students`

请求：

```json
{
  "items": [
    { "studentId": 3001, "groupNo": 1 },
    { "studentId": 3002, "groupNo": 2 }
  ]
}
```

权限：

- `homeroom_teacher`

说明：

- 任课教师默认不可调整分组

## 12. 萌宠接口

## 12.1 图鉴列表

`GET /api/v1/pets`

## 12.2 萌宠详情

`GET /api/v1/pets/:id`

## 12.3 学生领养萌宠

`POST /api/v1/student-pets/adopt`

请求：

```json
{
  "studentId": 3001,
  "petId": 6008,
  "classId": 2001,
  "sourceTerminal": "display"
}
```

权限：

- `homeroom_teacher`

说明：

- 第一阶段班主任可在 Display 执行领养
- 任课教师不开放领养

## 12.4 学生萌宠详情

`GET /api/v1/student-pets/:studentId`

## 13. 奖励兑换接口

## 13.1 奖励列表

`GET /api/v1/rewards`

用途：

- Admin 奖励中心
- Display 积分兑换页

## 13.2 创建奖励

`POST /api/v1/rewards`

权限：

- `school_admin`
- `moral_admin`

## 13.3 更新奖励

`PUT /api/v1/rewards/:id`

## 13.4 发起兑换

`POST /api/v1/reward-orders`

请求：

```json
{
  "classId": 2001,
  "studentId": 3001,
  "rewardId": 7003,
  "sourceTerminal": "display"
}
```

权限：

- `homeroom_teacher`

关键校验：

- Display 下必须已解锁教师操作模式
- 当前用户必须是该班班主任
- 学生当前积分足够
- 奖励状态可用
- 库存足够

业务动作：

1. 创建兑换记录
2. 扣减学生积分
3. 更新班级汇总
4. 广播 WebSocket

说明：

- 第一阶段即时生效
- 不加审核流
- 兑换创建成功后直接写入 `received` 状态

## 13.5 查询兑换记录

`GET /api/v1/reward-orders`

支持参数：

- `classId`
- `studentId`
- `status`

## 14. 荣誉接口

## 14.1 荣誉列表

`GET /api/v1/honors`

## 14.2 创建荣誉

`POST /api/v1/honors`

权限：

- `school_admin`
- `moral_admin`

## 14.3 发放荣誉

`POST /api/v1/honor-records`

## 14.4 查询荣誉记录

`GET /api/v1/honor-records`

## 15. Display 专用读取接口

这些接口本质上是聚合读接口，用于降低 Display 拼装成本。

## 15.1 进入页配置

`GET /api/v1/display/entry-config?classId=2001`

返回建议：

- 学校名称
- 校训
- 标题
- 副标题
- 背景图
- 动画配置

## 15.2 班级主页聚合数据

`GET /api/v1/display/classes/:id/home`

返回建议包含：

- 班级基础信息
- 顶部日期展示所需数据
- 学生卡片列表
- 今日排行
- 今日之星
- 班级目标
- 底部滚动消息
- 当前登录模式

## 15.3 排行榜数据

`GET /api/v1/display/classes/:id/leaderboard?type=score`

## 15.4 兑换页数据

`GET /api/v1/display/classes/:id/reward-center`

## 16. 学情评估接口

## 16.1 学生 AI 摘要

`GET /api/v1/ai/students/:studentId/summary?periodType=weekly`

返回建议：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "studentId": 3001,
    "periodType": "weekly",
    "positiveSummary": [
      { "dimension": "课堂学习", "count": 6 }
    ],
    "negativeSummary": [
      { "dimension": "课堂纪律", "count": 2 }
    ],
    "aiSummary": "本周课堂参与较稳定，合作行为提升明显。",
    "aiSuggestion": "建议继续强化作业及时性，并给予一次公开表扬。"
  }
}
```

权限：

- `homeroom_teacher`
- `subject_teacher` 仅限授课班级学生
- `grade_admin`
- `school_admin`

## 16.2 手动触发生成学情摘要

`POST /api/v1/ai/students/:studentId/generate-summary`

说明：

- 第一阶段只支持手动触发
- 第一阶段仅建议在 Admin 端使用
- 后续再扩展定时任务自动生成

## 17. WebSocket 设计

## 17.1 连接方式

建议命名空间：

```text
/ws
```

连接参数：

- token
- terminalType
- classId
- displayTerminalCode 可选

## 17.2 鉴权

连接时服务端校验：

- JWT 是否有效
- 用户是否有该班级访问权限
- 如果是 Display 写操作事件，是否为已解锁状态

## 17.3 房间模型

建议房间：

- `class:{classId}`
- `user:{userId}`

用途：

- 班级房间：推送班级实时数据
- 用户房间：推送个人操作反馈

## 17.4 服务端广播事件

### `classroom:score-updated`

场景：

- 单人、批量、按组加减分完成后

载荷：

```json
{
  "classId": 2001,
  "studentIds": [3001, 3002],
  "changedBy": 101,
  "sourceTerminal": "display",
  "timestamp": "2026-04-14T15:01:00+08:00"
}
```

### `classroom:student-updated`

场景：

- 某学生当前分值、等级、勋章发生变化

### `classroom:rank-updated`

场景：

- 排行榜需要刷新

### `classroom:goal-updated`

场景：

- 班级目标积分变化

### `classroom:reward-updated`

场景：

- 奖励兑换成功

### `classroom:honor-awarded`

场景：

- 荣誉授予成功

### `classroom:pet-upgraded`

场景：

- 萌宠升级成功

载荷建议：

```json
{
  "classId": 2001,
  "studentId": 3001,
  "petId": 6001,
  "beforeLevel": 2,
  "afterLevel": 3,
  "stageNo": 3
}
```

## 17.5 客户端发起事件

第一阶段建议客户端主要使用 HTTP 写接口，WebSocket 只负责接收广播。

原因：

- 容易审计
- 容易鉴权
- 容易重试

不建议第一阶段直接把加减分写操作走 WebSocket。

## 18. 权限校验规则清单

## 18.1 Display 端加减分

允许：

- 班主任
- 任课教师

限制：

- 必须在授权班级范围内
- 必须处于教师操作模式

## 18.2 Display 端兑换

允许：

- 班主任

拒绝：

- 任课教师
- 展示端账号

## 18.3 Display 端领养萌宠

允许：

- 班主任

拒绝：

- 任课教师
- 展示端账号

## 18.4 Admin 端规则管理

允许：

- 学校管理员
- 德育负责人

## 18.5 Admin 端学生档案与学情

允许：

- 班主任看本班
- 任课教师看授课班级学生
- 年级负责人看本年级
- 学校管理员看全校

## 19. 联调优先级建议

建议按这个顺序联调：

1. 登录与权限
2. 班级主页聚合数据
3. 单人加减分
4. 批量/按组加减分
5. WebSocket 广播刷新
6. 萌宠领养
7. 奖励兑换
8. 榜单读取
9. 学情摘要读取

## 20. 当前结论

本文件已经能支撑：

- 后端 Controller / Service 拆分
- 前端接口对接
- Display 实时同步
- 角色权限校验
- AI 学情摘要第一阶段联调

如果下一步继续推进，最顺的是：

- 生成 `Prisma Schema`
- 生成 `OpenAPI 草案`
- 生成 `前后端字段对照表`

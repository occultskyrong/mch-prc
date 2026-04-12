# mch-prc 项目设计文档

**日期**: 2026-04-12
**状态**: 设计完成，待用户审查

---

## 一、项目概述

### 1.1 项目名称
mch-prc（Modern China History - PRC Perspective）

### 1.2 项目目标
创建一个编年体中国近代史纪要系统，便于个人翻阅历史事件。

### 1.3 核心特点
- 以中华人民共和国视角梳理历史（1840-1949）
- 史料来源明确标注，优先官方认可史料
- 时间轴 × 群体-人物交叉展示，两轴可互换
- 事件内容分摘要层和细节层

### 1.4 技术栈
- **后端**: NestJS + TypeScript + PostgreSQL
- **前端**: React + Ant Design + Vite
- **数据交互**: RESTful API

### 1.5 史料准则
- 所有史料需明确标注来源
- 优先使用中华人民共和国官方认可的史料
- 来源类型：书籍、档案、官方网站、期刊等

---

## 二、数据模型

### 2.1 实体关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                         数据模型图                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    parentId     ┌──────────┐                     │
│  │  Group   │◄────────────────│  Group   │  (自关联层级)        │
│  │ (群体)   │─────────────────│ (群体)   │                     │
│  └──────────┘                 └──────────┘                     │
│       │                              │                          │
│       │ PersonGroupRelation          │                          │
│       │ (时间段归属)                  │                          │
│       ▼                              │                          │
│  ┌──────────┐                        │                          │
│  │  Person  │                        │                          │
│  │ (人物)   │                        │                          │
│  └──────────┘                        │                          │
│       │                              │                          │
│       │ PersonEventRelation          │                          │
│       │ (角色参与)                    │                          │
│       ▼                              │                          │
│  ┌──────────┐                        │                          │
│  │  Event   │◄───────────────────────┘                          │
│  │ (事件)   │                                                  │
│  └──────────┘                                                  │
│       │            ┌───────────────┐                            │
│       ├────────────│ EventSummary  │ (摘要层)                   │
│       │            └───────────────┘                            │
│       │            ┌───────────────┐                            │
│       ├────────────│ EventDetail   │ (细节层)                   │
│       │            └───────────────┘                            │
│       │                                                  │
│       │ EventRelation (多对多关联)                          │
│       │ ─────────────────────────────                       │
│       │  eventIdA ↔ eventIdB + relationType                 │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────┐                                           │
│  │  Source  │                                           │
│  │ (史料)   │                                           │
│  └──────────┘                                           │
│       │                                                  │
│       │ SourceRelation (综合关联)                        │
│       │ ─────────────────────────                       │
│       │  targetType + targetId + citationType           │
│       │                                                  │
│  ┌──────────┐                                           │
│  │ Location │ (地理位置)                                │
│  └──────────┘                                           │
│       │                                                  │
│       │ EventLocationRelation                           │
│       │                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 表结构定义

#### group（群体/派系表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| name | varchar(100) | 群体名称 |
| parentId | int | 父群体ID（自关联，可为空） |
| type | varchar(50) | 类型：党派/军阀/学派/其他 |
| description | text | 群体描述 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### person（人物表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| name | varchar(100) | 人物姓名 |
| birthYear | int | 出生年份 |
| deathYear | int | 逝世年份 |
| gender | varchar(10) | 性别 |
| bioSummary | text | 生平简介 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### person_group_relation（人物-群体归属表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| personId | int | 人物ID |
| groupId | int | 群体ID |
| startDate | date | 开始归属时间 |
| endDate | date | 结束归属时间（可为空，表示至今） |
| role | varchar(100) | 在群体中的角色 |
| createdAt | timestamp | 创建时间 |

#### event（事件主表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| title | varchar(200) | 事件标题 |
| startDate | date | 开始时间 |
| endDate | date | 结束时间（瞬间事件可为空） |
| isInstant | boolean | 是否瞬间事件 |
| eventType | varchar(50) | 类型：战争/条约/运动/起义/改革/其他 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### event_summary（事件摘要表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| eventId | int | 事件ID |
| content | text | 摘要内容 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### event_detail（事件细节表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| eventId | int | 事件ID |
| motive | text | 动机/原因 |
| process | text | 经过描述 |
| result | text | 结果 |
| impact | text | 影响 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### person_event_relation（人物-事件参与表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| personId | int | 人物ID |
| eventId | int | 事件ID |
| roleType | varchar(50) | 角色类型：领导者/参与者/决策者/对立者/受害者/其他 |
| roleDescription | text | 角色详细描述 |
| createdAt | timestamp | 创建时间 |

#### event_relation（事件-事件关联表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| eventIdA | int | 事件A ID |
| eventIdB | int | 事件B ID |
| relationType | varchar(50) | 关联类型：导致/促成/对立/延续/间接影响/其他 |
| description | text | 关联描述 |
| createdAt | timestamp | 创建时间 |

#### source（史料来源表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| title | varchar(200) | 史料标题 |
| author | varchar(100) | 作者 |
| publisher | varchar(100) | 出版方 |
| publishYear | int | 出版年份 |
| url | varchar(500) | 链接地址（可为空） |
| sourceType | varchar(50) | 类型：书籍/档案/网站/期刊/其他 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### source_relation（史料-内容关联表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| sourceId | int | 史料ID |
| targetType | varchar(50) | 目标类型：event_summary/event_detail/person/group |
| targetId | int | 目标ID |
| citationType | varchar(50) | 引用类型：主要参考/补充参考/对比参考 |
| createdAt | timestamp | 创建时间 |

#### location（地理位置表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| name | varchar(100) | 地点名称 |
| province | varchar(50) | 所属省份 |
| latitude | decimal | 经度（可选） |
| longitude | decimal | 纬度（可选） |
| createdAt | timestamp | 创建时间 |

#### event_location_relation（事件-地点关联表）
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | int | 主键，自增 |
| eventId | int | 事件ID |
| locationId | int | 地点ID |
| relationType | varchar(50) | 关系类型：发生地/主要地点/涉及地点 |
| createdAt | timestamp | 创建时间 |

---

## 三、API 设计

### 3.1 模块划分

| 模块 | 路径前缀 | 说明 |
|-----|---------|-----|
| 事件模块 | `/api/event` | 事件CRUD、查询、关联 |
| 人物模块 | `/api/person` | 人物CRUD、归属查询 |
| 群体模块 | `/api/group` | 群体层级CRUD |
| 史料模块 | `/api/source` | 史料来源管理 |
| 地点模块 | `/api/location` | 地理位置管理 |
| 可视化模块 | `/api/timeline` | 时间轴数据聚合查询 |

### 3.2 核心接口定义

#### 事件模块 /api/event
```
POST   /                    创建事件
GET    /list                 事件列表
       ?startDate=1840
       ?endDate=1949
       ?groupId=xxx
       ?personId=xxx
       ?eventType=xxx
GET    /:id                  事件详情（含摘要+细节+关联+人物）
PUT    /:id                  更新事件
DELETE /:id                  删除事件
GET    /:id/relations        获取事件关联关系
POST   /relation             创建事件关联
DELETE /relation/:id         删除事件关联
```

#### 人物模块 /api/person
```
POST   /                    创建人物
GET    /list                 人物列表
GET    /:id                  人物详情
PUT    /:id                  更新人物
DELETE /:id                  删除人物
GET    /:id/groups           人物所属群体历史
GET    /:id/events           人物参与事件
POST   /group-relation       创建人物-群体归属
DELETE /group-relation/:id   删除人物-群体归属
```

#### 群体模块 /api/group
```
POST   /                    创建群体
GET    /list                 群体列表（含层级树）
GET    /tree                 群体层级树
GET    /:id                  群体详情
PUT    /:id                  更新群体
DELETE /:id                  删除群体
GET    /:id/persons          群体所属人物
GET    /:id/events           群体相关事件
```

#### 史料模块 /api/source
```
POST   /                    创建史料
GET    /list                 史料列表
GET    /:id                  史料详情
PUT    /:id                  更新史料
DELETE /:id                  删除史料
GET    /:id/citations        史料引用统计
```

#### 地点模块 /api/location
```
POST   /                    创建地点
GET    /list                 地点列表
GET    /:id                  地点详情
PUT    /:id                  更新地点
DELETE /:id                  删除地点
```

#### 可视化模块 /api/timeline（核心）
```
GET    /matrix               获取时间轴矩阵数据
       ?startDate=1840
       ?endDate=1949
       ?groupBy=group|person
       ?groupId=xxx
       ?personId=xxx
       ?eventType=xxx
       ?granularity=year|month|day

返回格式：
{
  "columns": ["1840", "1841", "1842", ...],
  "rows": [
    {
      "id": 1,
      "name": "洋务派",
      "type": "group",
      "events": [
        {
          "eventId": 10,
          "title": "安庆内军械所创办",
          "year": "1861",
          "cellPosition": "1861"
        }
      ]
    }
  ]
}
```

---

## 四、前端页面结构

### 4.1 页面清单

| 页面 | 路径 | 说明 |
|-----|-----|-----|
| 时间轴矩阵页 | `/timeline` | 核心可视化页面 |
| 事件详情页 | `/event/:id` | 事件完整信息展示 |
| 人物详情页 | `/person/:id` | 人物生平、群体、事件 |
| 群体详情页 | `/group/:id` | 群体层级、人物、事件 |
| 史料详情页 | `/source/:id` | 史料信息、引用统计 |
| 管理后台 | `/admin/*` | 数据录入管理 |

### 4.2 页面布局说明

#### 时间轴矩阵页 `/timeline`
- 顶部：时间范围选择器、分组方式切换（群体/人物）、筛选条件
- 主体：交叉表格
  - 横轴：时间（年/月/日可选精度）
  - 纵轴：群体或人物列表
  - 单元格：事件概要（点击跳转详情页）
- 支持横纵轴互换

#### 事件详情页 `/event/:id`
- 基本信息：标题、时间、类型
- 摘要区块：简要概述
- 细节区块：动机、经过、结果、影响（分段展示）
- 关联事件：显示关联关系，可点击跳转
- 参与人物：列出人物及角色
- 史料来源：列出引用的史料

#### 人物详情页 `/person/:id`
- 基本信息：姓名、生卒年、性别
- 生平简介
- 所属群体历史：按时间线展示归属变化
- 参与事件列表

#### 群体详情页 `/group/:id`
- 基本信息：名称、类型、描述
- 层级关系：显示父群体和子群体
- 所属人物列表
- 相关事件列表

#### 管理后台 `/admin/*`
- 事件管理：列表、新增、编辑、删除
- 人物管理：列表、新增、编辑、删除
- 群体管理：列表、新增、编辑、删除、层级设置
- 史料管理：列表、新增、编辑、删除
- 关联管理：事件关联、人物-群体归属、人物-事件参与、史料引用

---

## 五、项目目录结构

```
mch-prc/
├── README.md
├── package.json
├── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   └── env.config.ts
│   │   │
│   │   ├── event/
│   │   │   ├── event.module.ts
│   │   │   ├── event.entity.ts
│   │   │   ├── event.dto.ts
│   │   │   ├── event.service.ts
│   │   │   ├── event.controller.ts
│   │   │   ├── event-summary.entity.ts
│   │   │   ├── event-detail.entity.ts
│   │   │   └── event-relation.entity.ts
│   │   │
│   │   ├── person/
│   │   │   ├── person.module.ts
│   │   │   ├── person.entity.ts
│   │   │   ├── person.dto.ts
│   │   │   ├── person.service.ts
│   │   │   ├── person.controller.ts
│   │   │   └── person-group-relation.entity.ts
│   │   │
│   │   ├── group/
│   │   │   ├── group.module.ts
│   │   │   ├── group.entity.ts
│   │   │   ├── group.dto.ts
│   │   │   ├── group.service.ts
│   │   │   └── group.controller.ts
│   │   │
│   │   ├── source/
│   │   │   ├── source.module.ts
│   │   │   ├── source.entity.ts
│   │   │   ├── source.dto.ts
│   │   │   ├── source.service.ts
│   │   │   ├── source.controller.ts
│   │   │   └── source-relation.entity.ts
│   │   │
│   │   ├── location/
│   │   │   ├── location.module.ts
│   │   │   ├── location.entity.ts
│   │   │   ├── location.dto.ts
│   │   │   ├── location.service.ts
│   │   │   ├── location.controller.ts
│   │   │   └── event-location-relation.entity.ts
│   │   │
│   │   ├── timeline/
│   │   │   ├── timeline.module.ts
│   │   │   ├── timeline.service.ts
│   │   │   └── timeline.controller.ts
│   │   │
│   │   └── common/
│   │       ├── base.entity.ts
│   │       ├── base.dto.ts
│   │       └── utils.ts
│   │
│   └── migrations/
│   └── test/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   │   └ index.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── TimelinePage/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── MatrixTable.tsx
│   │   │   │   └── FilterBar.tsx
│   │   │   │
│   │   │   ├── EventDetailPage/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── SummarySection.tsx
│   │   │   │   ├── DetailSection.tsx
│   │   │   │   └── RelationSection.tsx
│   │   │   │
│   │   │   ├── PersonDetailPage/
│   │   │   │   ├── index.tsx
│   │   │   │
│   │   │   ├── GroupDetailPage/
│   │   │   │   ├── index.tsx
│   │   │   │
│   │   │   ├── SourceDetailPage/
│   │   │   │   ├── index.tsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── AdminLayout.tsx
│   │   │       ├── EventManage/
│   │   │       ├── PersonManage/
│   │   │       ├── GroupManage/
│   │   │       └── SourceManage/
│   │   │
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Header/
│   │   │   └── Sidebar/
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── eventService.ts
│   │   │   ├── personService.ts
│   │   │   ├── groupService.ts
│   │   │   ├── sourceService.ts
│   │   │   └── timelineService.ts
│   │   │
│   │   ├── types/
│   │   │   ├── event.ts
│   │   │   ├── person.ts
│   │   │   ├── group.ts
│   │   │   ├── source.ts
│   │   │   └── timeline.ts
│   │   │
│   │   └ utils/
│   │   │   ├── dateUtils.ts
│   │   │   └── formatUtils.ts
│   │   │
│   │   └── styles/
│   │   │   └ global.css
│   │   │
│   │   └── vite-env.d.ts
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
│
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-12-mch-prc-design.md
```

---

## 六、开发计划建议

### 6.1 阶段划分

| 阶段 | 内容 | 说明 |
|-----|-----|-----|
| Phase 1 | 后端基础搭建 | NestJS项目初始化、数据库连接、基础Entity和CRUD |
| Phase 2 | 后端核心API | 完成所有模块的Service和Controller |
| Phase 3 | 前端基础搭建 | React项目初始化、Ant Design配置、路由配置 |
| Phase 4 | 核心可视化 | Timeline矩阵页面开发 |
| Phase 5 | 详情页面 | 事件、人物、群体、史料详情页 |
| Phase 6 | 管理后台 | 数据录入管理功能 |
| Phase 7 | 数据录入 | 录入第一批近代史数据 |

---

## 七、约束与注意事项

1. **史料来源合规**: 所有史料需符合中华人民共和国法律法规，优先使用官方认可的史料来源
2. **数据精度**: 时间字段支持不完整日期（如只有年份），显示时按精度呈现
3. **关联关系**: 事件关联需双向考虑，A导致B与B被A导致应同时记录或通过查询处理
4. **层级深度**: 群体层级理论上无限，但实际使用建议控制在2-3层
5. **个人项目**: 本项目为个人翻阅使用，不考虑多用户、权限等复杂功能

---

*文档完成，待用户审查*
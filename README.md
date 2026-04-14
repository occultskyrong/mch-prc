# mch-prc (Modern China History - PRC Perspective)

中国近代史编年体纪要系统，以中华人民共和国视角梳理 1840-1949 年历史事件。

## 功能特点

- **时间轴矩阵可视化**: 横轴时间、纵轴群体-人物，两轴可互换
- **史料来源标注**: 所有史料明确标注出处，优先官方认可史料
- **事件双层内容**: 摘要层（简要概述）+ 细节层（动机、经过、结果、影响）
- **关联关系追踪**: 事件之间的因果关联、人物参与角色

## 技术栈

| 层级 | 技术 |
|-----|-----|
| 后端 | NestJS + TypeScript + TypeORM + PostgreSQL |
| 前端 | React + TypeScript + Ant Design + Vite |
| 数据交互 | RESTful API + Axios |

## 项目结构

```
mch-prc/
├── backend/               # NestJS 后端
│   ├── src/
│   │   ├── event/         # 事件模块 (核心)
│   │   ├── person/        # 人物模块
│   │   ├── group/         # 群体模块
│   │   ├── source/        # 史料模块
│   │   ├── location/      # 地点模块
│   │   ├── timeline/      # 时间轴模块
│   │   └── common/        # 公共类
│   └── .env               # 数据库配置
│
├── frontend/              # React 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TimelinePage/      # 时间轴矩阵页
│   │   │   ├── EventDetailPage/   # 事件详情页
│   │   │   └── admin/             # 管理后台
│   │   ├── services/              # API 服务
│   │   └── routes/                # 路由配置
│   └── vite.config.ts            # Vite 配置
│
└── docs/
    └── superpowers/
        ├── specs/                 # 设计文档
        └── plans/                 # 实施计划
```

## 快速开始

### 1. 配置数据库

创建 PostgreSQL 数据库：
```sql
CREATE DATABASE mch_prc;
```

修改 `backend/.env` 配置：
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=mch_prc
```

### 2. 启动后端

```bash
cd backend
npm install
npm run start:dev
```

后端服务运行在 http://localhost:3000

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 http://localhost:5173

### 4. 访问应用

- 时间轴页面: http://localhost:5173/timeline
- 管理后台: http://localhost:5173/admin

## API 接口

| 模块 | 路径 | 说明 |
|-----|------|-----|
| 事件 | `/api/event` | 事件 CRUD、关联查询 |
| 人物 | `/api/person` | 人物 CRUD、群体归属 |
| 群体 | `/api/group` | 群体层级 CRUD |
| 史料 | `/api/source` | 史料来源管理 |
| 地点 | `/api/location` | 地理位置管理 |
| 时间轴 | `/api/timeline/matrix` | 矩阵数据聚合 |

## 数据模型

核心实体：
- **Event**: 历史事件 (title, startDate, endDate, eventType)
- **EventSummary**: 事件摘要 (content)
- **EventDetail**: 事件细节 (motive, process, result, impact)
- **Person**: 人物 (name, birthYear, deathYear, gender)
- **Group**: 群体 (name, parentId, type) - 支持层级自关联
- **Source**: 史料来源 (title, author, publisher, sourceType)

关联关系：
- PersonGroupRelation: 人物-群体归属（时间段）
- PersonEventRelation: 人物-事件参与（角色）
- EventRelation: 事件-事件关联（因果类型）
- SourceRelation: 史料-内容引用

## License

MIT
# CLAUDE.md - MCH-PRC 中国近代史时间轴

## 项目概述

MCH-PRC 是中国近代史时间轴系统，覆盖 1839-1949 年历史事件数据。

- **项目类型**: Monorepo（NestJS 后端 + React 前端）
- **技术栈**: React + TypeScript + Ant Design + Vite | NestJS + Mongoose + MongoDB
- **包管理**: npm workspaces
- **Node版本**: >= 20.11.1

## 目录结构

```
mch-prc/
├── backend/                      # NestJS 后端
│   ├── src/
│   │   ├── modules/
│   │   │   ├── events/           # 事件 CRUD + 影响力因子计算
│   │   │   ├── persons/          # 人物数据
│   │   │   ├── groups/           # 群体数据
│   │   │   ├── periods/          # 历史时期
│   │   │   └── sources/          # 史料来源
│   │   ├── common/
│   │   │   └── impact-factor/    # 影响力因子计算器
│   │   ├── env-bootstrap.ts      # 环境变量加载（必须在 main.ts 首行 import）
│   │   └── main.ts
│   └── scripts/                  # 数据导入/迁移脚本
│
├── frontend/                     # React 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TimelinePage/     # 时间轴主页（矩阵/列表视图）
│   │   │   └── EventDetailPage/  # 事件详情页（影响力分析）
│   │   ├── services/             # API 请求服务
│   │   ├── types/                # TypeScript 类型
│   │   ├── hooks/
│   │   │   └── useInfiniteScroll # 无限滚动 Hook
│   │   └── utils/
│   │       ├── impactFactor.ts   # 前端影响力因子工具
│   │       └── sourceRegistry.ts # 来源注册表工具
│   └── vite.config.ts            # 含 /api proxy 到后端
│
├── raw/                          # 原始 Markdown 年表数据
└── docs/                         # 项目文档
```

## 开发命令

```bash
# 开发环境（同时启动前后端）
npm run dev

# 仅后端
npm run dev:backend        # NestJS 热重载
npm run dev:frontend       # Vite 开发服务器

# 构建
npm run build

# 数据导入（后端）
cd backend && node scripts/apply-book-enrichment.cjs
cd backend && node scripts/apply-causal-chain.cjs
```

## API 代理

前端 Vite 配置将 `/api` 代理到 `http://localhost:3000`，开发时前后端共用端口访问。

## 编码规范

### 命名规范

- **Service 注入缩写**: `irp` = repository, `cs` = child service
- **私有方法**: `__` 前缀
- **文件名**: snake_case

### 数据库

- MongoDB 集合名与模型名一致时，Schema 需显式声明 `collection: 'xxx'`
- 跨模块 populate 需要在模块间显式 import 对应的 Module

### 环境变量

`.env` 必须在 `main.ts` 首行通过 `env-bootstrap.ts` 加载，确保 NestJS 模块初始化前环境变量已就绪。

## 群体体系

人物按政治效忠归入 9 个一级阵营，每个阵营下设若干二级子群体，共 33 个子群体。详见 `docs/260423-群体分类体系.md`。

9 阵营：清廷、太平天国、革命派、军阀、中国共产党、国民党、日本侵略军、外国势力、其他。

人物 `groupIds` 数组同时包含一级和二级群体 ID。

## 影响力因子算法

每个事件通过 `ImpactFactorCalculator` 计算多维度评分，详见 `docs/260418-影响因子算法.md`。

## 史料来源

来源独立注册在 `sources.json`，事件通过 `sourceIds` 引用：

```typescript
interface EventDetailField {
  content: string;
  sourceIds: string[];
}
```

## 关联项目

- **ai-foundation**: AI 基座服务，PTS Server 通过 `/admin/ai/*` 代理

## 前端开发规则

- **所有前端相关任务（改样式、加组件、重构 UI、调整布局等）必须先调用 `frontend-design` 技能**
- 技能通过 `Skill` 工具调用，在任何前端代码修改之前执行
- 不要依赖默认行为或经验判断，显式调用该技能

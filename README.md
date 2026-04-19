# mch-prc (Modern China History - PRC Perspective)

中国近代史编年体纪要系统，以中华人民共和国视角梳理 1839-1949 年历史事件。

**当前版本**: v1.3.0

## 功能特点

- **时间轴矩阵可视化**: 横轴时间、纵轴群体/人物，两轴可互换
- **历史时期划分**: 六大时期，支持快捷切换
- **史料来源标注**: 所有史料明确标注出处，支持按来源聚合统计
- **事件双层内容**: 摘要层 + 细节层（动机、经过、结果、影响）
- **影响因子评估**: 多维度量化评分（0-1000），支持历史重要性排序
- **关联关系追踪**: 事件因果关联、人物参与角色
- **移动端兼容**: 响应式设计，头部可折叠

## v1.3.0 更新

### 性能优化
- **矩阵视图动态加载**: 不再一次性加载全部事件，按 15 年分批滚动加载
- **无限滚动**: 基于 IntersectionObserver 自动触发下一批数据加载

### UI 改进
- **表头固定**: 矩阵表格表头滚动时固定，方便查看列头
- **筛选栏可收起**: Web 端支持收起筛选栏（时期选择、搜索栏、图例全部收起为摘要条）
- **筛选栏整合**: 时期选择、搜索控件、标记图例统一整合在筛选栏内，支持一起收起

### 数据迁移
- **后端 API 驱动**: 从静态 JSON 迁移到 MongoDB + NestJS API
- **来源独立注册**: 史料来源抽象为独立注册表，事件通过 ID 引用

## 技术栈

### 前端
- React 18 + TypeScript + Ant Design 5 + Vite 5
- 无限滚动 Hook + IntersectionObserver

### 后端
- NestJS + Mongoose + MongoDB
- npm workspaces monorepo

### 数据存储
- MongoDB 存储事件、人物、群体、史料来源数据
- 开发时通过 Vite proxy 代理 `/api` 到后端服务

## 项目结构

```
mch-prc/
├── backend/
│   ├── src/modules/
│   │   ├── events/           # 事件 CRUD + 影响力因子计算
│   │   ├── persons/          # 人物数据
│   │   ├── groups/           # 群体数据
│   │   ├── periods/          # 历史时期
│   │   └── sources/          # 史料来源
│   ├── src/common/
│   │   └── impact-factor/    # 影响力因子计算器
│   └── scripts/              # 数据导入/迁移脚本
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TimelinePage/       # 时间轴主页
│   │   │   └── EventDetailPage/    # 事件详情页（影响力分析）
│   │   ├── services/               # API 服务
│   │   ├── hooks/
│   │   │   └── useInfiniteScroll   # 无限滚动 Hook
│   │   └── utils/
│   │       ├── impactFactor.ts     # 影响力因子工具
│   │       └── sourceRegistry.ts   # 来源注册表工具
│
├── raw/                    # 原始 Markdown 年表数据
└── docs/                   # 项目文档
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入 MongoDB 连接串
```

### 启动开发服务器

```bash
npm run dev
```

前端访问 http://localhost:5173，API 代理到后端 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 数据统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 历史事件 | 1000+ | 1839-1949年重大历史事件 |
| 人物 | 478 | 参与事件的关键人物 |
| 群体 | 13 | 洋务派、清廷、太平天国、革命派等 |

## 历史时期划分

| 时期 | 年份 | 代表事件 |
|------|------|----------|
| 鸦片战争时期 | 1839-1860 | 鸦片战争、太平天国、第二次鸦片战争 |
| 洋务运动时期 | 1861-1894 | 洋务运动、中法战争、甲午战争 |
| 甲午战后时期 | 1895-1900 | 戊戌变法、义和团运动、八国联军 |
| 清末新政时期 | 1901-1911 | 清末新政、废除科举、辛亥革命 |
| 民国初期 | 1912-1926 | 民国成立、五四运动、北伐战争 |
| 国民政府时期 | 1927-1949 | 抗日战争、解放战争、新中国成立 |

## 数据模型

### 事件 (Event)
```typescript
interface Event {
  _id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  eventType: string;
  location?: string;
  summary: string;
  detail?: {
    motive?: EventDetailField;
    process?: EventDetailField;
    result?: EventDetailField;
    impact?: EventDetailField;
  };
  personIds?: string[];
  relatedEvents?: string[];
  impactFactor?: ImpactFactor;
  sourceIds?: string[];
}
```

### 事件详情字段
```typescript
interface EventDetailField {
  content: string;
  sourceIds: string[];
}
```

### 人物 (Person)
```typescript
interface Person {
  _id: string;
  name: string;
  birthYear?: number;
  deathYear?: number;
  gender?: string;
  bioSummary?: string;
  groupIds?: string[];
}
```

### 群体 (Group)
```typescript
interface Group {
  _id: string;
  name: string;
  parentId?: string;
  type?: string;
  description?: string;
}
```

## 部署

### 服务端部署
```bash
./deploy.sh /var/www/mch-prc
```

## 版本日志

### v1.3.0 (2026-04-19)
- 矩阵视图动态加载（按 15 年分批滚动加载）
- 表头固定（Ant Design scroll.y）
- 筛选栏可收起（Web 端）
- 筛选栏整合（时期选择、搜索、图例统一）
- 后端 MongoDB 数据驱动（替代静态 JSON）
- 史料来源独立注册表

### v1.2.0
- 事件影响因子量化评分系统
- 史料来源标注

## License

MIT

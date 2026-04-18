# 版本迭代日志

## v1.3.0 (规划)

**目标**: 重构项目架构，前后端分离，MongoDB 数据持久化

### 架构变更

| 项目 | v1.x | v1.3.0 |
|------|------|--------|
| 架构 | 纯静态前端 | 前后端分离（两个独立项目） |
| 数据存储 | JSON 文件 | MongoDB |
| 后端服务 | 无 | NestJS |
| API | 无 | RESTful API |

### 项目结构（单仓库，前后端分离文件夹）

```
mch-prc/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── pages/
│   │   ├── services/            # 改为调用后端API
│   │   ├── types/
│   │   └── components/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env                     # VITE_API_BASE_URL
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── modules/
│   │   │   ├── events/
│   │   │   │   ├── events.controller.ts
│   │   │   │   ├── events.service.ts
│   │   │   │   ├── events.schema.ts
│   │   │   │   └── events.dto.ts
│   │   │   ├── persons/
│   │   │   ├── groups/
│   │   │   └── periods/
│   │   ├── common/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── scripts/
│   │   └── migrate-to-mongo.ts
│   ├── package.json
│   ├── nest-cli.json
│   └── .env                     # MongoDB配置
│
├── raw/                         # 原始Markdown数据（保留）
├── docs/                        # 文档
├── .gitignore
└── README.md
```

### API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/events` | GET | 事件列表（分页、筛选） |
| `/api/events/:id` | GET | 事件详情 |
| `/api/events` | POST | 创建事件 |
| `/api/events/:id` | PUT | 更新事件 |
| `/api/events/:id` | DELETE | 删除事件 |
| `/api/persons` | GET | 人物列表 |
| `/api/groups` | GET | 群体列表 |

### MongoDB Schema

**Event**:

```typescript
{
  title: String,
  startDate: Date,
  endDate: Date,
  eventType: String,
  location: String,
  summary: String,
  detail: { motive, process, result, impact },
  impactFactor: Number,
  periodId: ObjectId,
  personIds: [ObjectId],
  subEvents: [{ title, date, content }],
  source: String
}
```

**Person**:

```typescript
{
  name: String,
  birthYear: Number,
  deathYear: Number,
  gender: String,
  bioSummary: String,
  groupIds: [ObjectId]
}
```

### 数据迁移

- 从 `mch-prc/public/data/*.json` 迁移到 MongoDB
- 编写迁移脚本 `migrate-to-mongo.ts`

---

## 当前版本: v1.2.0

**发布日期**: 2026-04-18

### 新功能

- **点击年份查看事件列表**: 点击年份可弹出Drawer显示该年所有事件，按时间排序，点击事件可跳转详情
- **Feature规划文档**: 添加三大功能规划（影响因子量化、RAG关联发现、图谱可视化）

### 优化

- **README文档更新**: 更新项目结构、数据统计、时期划分表格
- **Co-Authored-By标识**: 使用正确的模型标识 `GLM-5 <noreply@zhipuai.cn>`

---

## v1.1.0

**发布日期**: 2026-04-18

### 新功能

- **时期年份范围显示**: 时期列显示年份范围（如 1839-1860）
- **颜色说明图例**: 筛选栏下方添加事件类型和群体颜色图例

### 修复

- **时期列显示问题**: 
  - 改为顶部对齐，确保时期标题始终可见
  - 时期列和年份列使用sticky固定，避免被其他列覆盖
- **时期列宽度**: 从90px缩小到40px，文字竖排显示

### 优化

- **移动端兼容**: 
  - 添加头部折叠功能，默认收缩时期概览和筛选栏
  - 添加移动端适配CSS样式
- **减少留白**: 页面padding从24px减少到8px

---

## v1.0.0

**发布日期**: 2026-04-17

### 核心功能

- **时间轴矩阵可视化**: 
  - 横轴时间（年份）、纵轴群体/人物
  - 支持四种视图：时间×群体、时间×人物、按群体、按人物
- **历史时期划分**: 
  - 鸦片战争时期 (1839-1860)
  - 洋务运动时期 (1861-1894)
  - 甲午战后时期 (1895-1900)
  - 清末新政时期 (1901-1911)
  - 民国初期 (1912-1926)
  - 国民政府时期 (1927-1949)
- **事件筛选**: 
  - 搜索事件标题
  - 选择年份范围
  - 筛选事件类型
  - 筛选参与群体
- **事件详情**: 
  - 抽屉显示事件详细信息
  - 包含时间、地点、概述、动机、经过、结果、影响
  - 显示参与人物及其所属群体

### 数据

- **历史事件**: 1075 条（包含93个子事件）
- **人物**: 478 人
- **群体**: 13 个

### 技术栈

- React 18 + TypeScript
- Ant Design 5
- Vite 5
- 纯静态部署（JSON数据文件）

---

## 版本规划

### v1.3.0 (计划)

- **影响因子优化**: 多维度评分模型
- **图谱可视化**: D3.js/G6 展示事件关系网络

### v2.0.0 (计划)

- **RAG关联发现**: 向量检索 + LLM分析事件关联
- **图算法分析**: PageRank、社群发现、路径分析

详见 [FEATURES.md](FEATURES.md)
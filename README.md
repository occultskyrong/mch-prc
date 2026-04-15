# mch-prc (Modern China History - PRC Perspective)

中国近代史编年体纪要系统，以中华人民共和国视角梳理 1840-1949 年历史事件。

## 功能特点

- **时间轴矩阵可视化**: 横轴时间、纵轴群体-人物，两轴可互换
- **史料来源标注**: 所有史料明确标注出处，优先官方认可史料
- **事件双层内容**: 摘要层（简要概述）+ 细节层（动机、经过、结果、影响）
- **关联关系追踪**: 事件之间的因果关联、人物参与角色

## 技术栈

纯静态前端架构：
- React + TypeScript + Ant Design + Vite
- 数据存储为 JSON 文件

## 项目结构

```
mch-prc/
├── src/
│   ├── pages/
│   │   ├── TimelinePage/      # 时间轴矩阵页
│   │   └── EventDetailPage/   # 事件详情页
│   ├── services/              # 数据读取服务
│   ├── types/                 # TypeScript 类型定义
│   ├── routes/                # 路由配置
│   └── components/            # 公共组件
│
├── public/
│   └── data/                  # JSON 数据文件
│       ├── events.json         # 历史事件数据
│       ├── persons.json        # 人物数据
│       ├── groups.json         # 群体数据
│       └── sources.json        # 史料来源数据
│
├── package.json
├── vite.config.ts
└── index.html
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

## 数据模型

### 事件 (Event)
```json
{
  "id": 1,
  "title": "鸦片战争",
  "startDate": "1840-06-01",
  "endDate": "1842-08-01",
  "eventType": "战争",
  "summary": "简要概述...",
  "detail": {
    "motive": "动机原因",
    "process": "经过描述",
    "result": "结果",
    "impact": "影响"
  },
  "personIds": [1, 2, 3],
  "relatedEvents": [2]
}
```

### 人物 (Person)
```json
{
  "id": 1,
  "name": "林则徐",
  "birthYear": 1785,
  "deathYear": 1850,
  "gender": "男",
  "bioSummary": "生平简介",
  "groupIds": [1]
}
```

### 群体 (Group)
```json
{
  "id": 1,
  "name": "洋务派",
  "parentId": null,
  "type": "学派",
  "description": "群体描述"
}
```

## 已录入数据示例

当前已录入 10 个重要历史事件：
1. 鸦片战争 (1840-1842)
2. 《南京条约》签订 (1842)
3. 太平天国运动 (1851-1864)
4. 洋务运动 (1861-1895)
5. 甲午战争 (1894-1895)
6. 戊戌变法 (1898)
7. 辛亥革命 (1911-1912)
8. 五四运动 (1919)
9. 中国共产党成立 (1921)
10. 中华人民共和国成立 (1949)

## License

MIT
# 事件列表分页与无限滚动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将事件列表从静态 JSON 改为后端 API 分页查询 + 前端无限滚动加载，矩阵视图仍使用服务端全量数据按年聚合。

**Architecture:** 后端扩展查询接口支持年份范围过滤，前端新建 API 服务替代静态 JSON，创建 `useInfiniteScroll` hook 处理滚动加载。列表视图（按群体/按人物）用无限滚动，矩阵视图改用 API 加载全部数据。

**Tech Stack:** NestJS + MongoDB/Mongoose (后端), React 18 + Ant Design 5 (前端)

---

## 文件映射

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `backend/src/modules/events/events.dto.ts` | QueryEventsDto 增加 `startYear`、`endYear` |
| 修改 | `backend/src/modules/events/events.service.ts:16-40` | findAll 支持年份范围过滤 |
| 修改 | `backend/src/modules/events/events.controller.ts` | 增加 `/persons`、`/groups` 代理接口 |
| 修改 | `frontend/package.json` | 添加 `react-router-dom` 依赖 |
| 新建 | `frontend/src/services/api.ts` | 统一 API 请求服务，封装 fetch + `/api` 前缀 |
| 新建 | `frontend/src/hooks/useInfiniteScroll.ts` | 无限滚动自定义 hook |
| 修改 | `frontend/src/services/eventService.ts` | 从 `/api/events` API 获取数据，不再读 JSON |
| 修改 | `frontend/src/pages/TimelinePage/index.tsx` | 核心改动：集成 API + 无限滚动 |
| 修改 | `frontend/src/pages/TimelinePage/index.css` | 添加 loading spinner 样式 |

---

### Task 1: 后端支持年份范围查询

**Files:**
- Modify: `backend/src/modules/events/events.dto.ts`
- Modify: `backend/src/modules/events/events.service.ts:16-40`

- [ ] **Step 1: 修改 QueryEventsDto 添加年份范围参数**

```typescript
// backend/src/modules/events/events.dto.ts
// 在现有 QueryEventsDto 中添加 startYear 和 endYear:
export class QueryEventsDto {
  page?: number = 1;
  pageSize?: number = 10;
  year?: number;            // 保留向后兼容
  startYear?: number;       // 新增：起始年份
  endYear?: number;         // 新增：结束年份
  eventType?: string;
  groupId?: string;
  search?: string;
}
```

- [ ] **Step 2: 修改 findAll 的年份过滤逻辑**

替换 `events.service.ts` 中的年份过滤部分（原第23-27行）：

```typescript
// 替换原来的:
// if (year) {
//   const start = new Date(year, 0, 1);
//   const end = new Date(year, 11, 31);
//   filter.startDate = { $gte: start, $lte: end };
// }

// 改为:
if (year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  filter.startDate = { $gte: start, $lte: end };
} else if (startYear || endYear) {
  const dateFilter: any = {};
  if (startYear) dateFilter.$gte = new Date(startYear, 0, 1);
  if (endYear) dateFilter.$lte = new Date(endYear, 11, 31);
  filter.startDate = dateFilter;
}
```

- [ ] **Step 3: 验证后端编译**

Run: `cd /Users/zhangrz/code/github/mch-prc/backend && yarn build`
Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
cd /Users/zhangrz/code/github/mch-prc
git add backend/src/modules/events/events.dto.ts backend/src/modules/events/events.service.ts
git commit -m "feat(backend): 支持 startYear/endYear 年份范围查询"
```

---

### Task 2: 后端添加 persons/groups 代理接口

**Files:**
- Create: `backend/src/modules/persons/persons.controller.ts`
- Modify: `backend/src/modules/persons/persons.module.ts`
- Create: `backend/src/modules/groups/groups.controller.ts`
- Modify: `backend/src/modules/groups/groups.module.ts`

当前 persons 和 groups 模块已有 Service 但从 JSON 读数据。我们需要 Controller 暴露它们为 API。

- [ ] **Step 1: 查看现有 persons 和 groups 模块结构**

```bash
ls /Users/zhangrz/code/github/mch-prc/backend/src/modules/persons/
ls /Users/zhangrz/code/github/mch-prc/backend/src/modules/groups/
```

- [ ] **Step 2: 创建 PersonsController**

```typescript
// backend/src/modules/persons/persons.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { PersonsService } from './persons.service';

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Get()
  findAll() {
    return this.personsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personsService.findOne(id);
  }
}
```

- [ ] **Step 3: 创建 GroupsController**

```typescript
// backend/src/modules/groups/groups.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }
}
```

- [ ] **Step 4: 注册 Controllers**

在 `backend/src/modules/persons/persons.module.ts` 的 `controllers` 数组中添加 `PersonsController`。
在 `backend/src/modules/groups/groups.module.ts` 的 `controllers` 数组中添加 `GroupsController`。

- [ ] **Step 5: 验证 persons/groups Service 是否有 findAll 方法**

检查 `persons.service.ts` 和 `groups.service.ts` 是否有 `findAll()` 方法，如果没有则添加：

```typescript
// 如果没有，在 persons.service.ts 中添加：
async findAll() {
  return this.personModel.find().exec();
}

async findOne(id: string) {
  return this.personModel.findById(id).exec();
}
```

```typescript
// 如果没有，在 groups.service.ts 中添加：
async findAll() {
  return this.groupModel.find().exec();
}

async findOne(id: string) {
  return this.groupModel.findById(id).exec();
}
```

- [ ] **Step 6: 验证后端编译**

Run: `cd /Users/zhangrz/code/github/mch-prc/backend && yarn build`
Expected: 无编译错误

- [ ] **Step 7: Commit**

```bash
cd /Users/zhangrz/code/github/mch-prc
git add backend/src/modules/persons/persons.controller.ts backend/src/modules/persons/persons.module.ts backend/src/modules/groups/groups.controller.ts backend/src/modules/groups/groups.module.ts
git commit -m "feat(backend): 添加 /api/persons 和 /api/groups 接口"
```

---

### Task 3: 前端添加 react-router-dom 依赖 + 创建 API 基础服务

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/services/api.ts`

- [ ] **Step 1: 添加 react-router-dom 依赖**

```bash
cd /Users/zhangrz/code/github/mch-prc/frontend
yarn add react-router-dom
```

- [ ] **Step 2: 创建统一 API 服务**

```typescript
// frontend/src/services/api.ts
const API_BASE = '/api';

async function request<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, params?: Record<string, any>) => request<T>(path, params),
};
```

- [ ] **Step 3: Commit**

```bash
cd /Users/zhangrz/code/github/mch-prc
git add frontend/package.json frontend/yarn.lock frontend/src/services/api.ts
git commit -m "feat(frontend): 添加 react-router-dom 依赖和 API 基础服务"
```

---

### Task 4: 创建 useInfiniteScroll Hook

**Files:**
- Create: `frontend/src/hooks/useInfiniteScroll.ts`

- [ ] **Step 1: 创建无限滚动 hook**

```typescript
// frontend/src/hooks/useInfiniteScroll.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
  deps?: unknown[];
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 20,
  deps = [],
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (page: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await fetchFn(page, pageSize);
      setItems(prev => page === 1 ? result.data : [...prev, ...result.data]);
      setTotal(result.total);
      setHasMore(result.data.length === pageSize && items.length + result.data.length < result.total);
    } catch (e) {
      console.error('Infinite scroll fetch error:', e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFn, pageSize]);

  useEffect(() => {
    setItems([]);
    pageRef.current = 1;
    setHasMore(true);
    loadPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      pageRef.current += 1;
      loadPage(pageRef.current);
    }
  }, [hasMore, loadPage]);

  const reset = useCallback(() => {
    setItems([]);
    pageRef.current = 1;
    setHasMore(true);
    loadPage(1);
  }, [loadPage]);

  return { items, loading, hasMore, total, loadMore, reset };
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/zhangrz/code/github/mch-prc
git add frontend/src/hooks/useInfiniteScroll.ts
git commit -m "feat(frontend): 创建 useInfiniteScroll 自定义 hook"
```

---

### Task 5: 重写 eventService 使用 API

**Files:**
- Modify: `frontend/src/services/eventService.ts`
- Modify: `frontend/src/types/event.ts`

- [ ] **Step 1: 更新 Event 类型以匹配 MongoDB 返回格式**

MongoDB 的 `_id` 是 ObjectId 字符串，不是数字 ID。需要兼容。

```typescript
// frontend/src/types/event.ts
// 更新 Event 接口，id 改为 string | number：
export interface Event {
  _id?: string;       // MongoDB ObjectId
  id?: number;        // 向后兼容旧 JSON 数据
  title: string;
  startDate: string;
  endDate?: string;
  isInstant?: boolean;
  eventType: string;
  location?: string;
  summary: string;
  detail?: {
    motive?: string;
    process?: string;
    result?: string;
    impact?: string;
  };
  impactFactor?: ImpactFactor;
  personIds?: string[];  // 改为 string[] 对应 MongoDB ObjectId
  relatedEvents?: string[];
}

// 更新 EventListParams：
export interface EventListParams {
  page?: number;
  pageSize?: number;
  startYear?: number;
  endYear?: number;
  eventType?: string;
  search?: string;
}

// 更新 API 响应类型：
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

- [ ] **Step 2: 重写 eventService 使用 API**

```typescript
// frontend/src/services/eventService.ts
import { api } from './api';
import { Event, EventListParams, PaginatedResponse } from '../types/event';

export const eventService = {
  list: async (params?: EventListParams): Promise<PaginatedResponse<Event>> => {
    return api.get<PaginatedResponse<Event>>('/events', {
      page: params?.page,
      pageSize: params?.pageSize,
      startYear: params?.startYear,
      endYear: params?.endYear,
      eventType: params?.eventType,
      search: params?.search,
    });
  },

  findById: async (id: string): Promise<Event | undefined> => {
    return api.get<Event>(`/events/${id}`);
  },
};
```

- [ ] **Step 3: 同样更新 personService 和 groupService 使用 API**

```typescript
// frontend/src/services/personService.ts
import { api } from './api';

export const personService = {
  list: async () => {
    return api.get<any[]>('/persons');
  },

  findById: async (id: string) => {
    return api.get<any>(`/persons/${id}`);
  },
};
```

```typescript
// frontend/src/services/groupService.ts
import { api } from './api';

export const groupService = {
  list: async () => {
    return api.get<any[]>('/groups');
  },

  findById: async (id: string) => {
    return api.get<any>(`/groups/${id}`);
  },
};
```

- [ ] **Step 4: Commit**

```bash
cd /Users/zhangrz/code/github/mch-prc
git add frontend/src/services/eventService.ts frontend/src/services/personService.ts frontend/src/services/groupService.ts frontend/src/types/event.ts
git commit -m "refactor(frontend): 将 service 层从静态 JSON 改为 API 调用"
```

---

### Task 6: 重写 TimelinePage 集成 API + 无限滚动

**Files:**
- Modify: `frontend/src/pages/TimelinePage/index.tsx`
- Modify: `frontend/src/pages/TimelinePage/index.css`

这是最核心的改动。关键变化：
- 矩阵视图（`matrix-group`/`matrix-person`）：需要完整数据集来构建矩阵，改为从 API 加载全部数据（大 pageSize）
- 列表视图（`group`/`person`）：使用 `useInfiniteScroll` hook 实现无限滚动

- [ ] **Step 1: 重写 TimelinePage 核心逻辑**

```typescript
// frontend/src/pages/TimelinePage/index.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Select, Input, Tag, Drawer, Descriptions, Typography, Space, Button, Tooltip, Empty, Table, Spin } from 'antd';
import { SearchOutlined, CalendarOutlined, UserOutlined, TeamOutlined, MenuOutlined, CloseOutlined, ExperimentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './index.css';
import { eventService } from '../../services/eventService';
import { personService } from '../../services/personService';
import { groupService } from '../../services/groupService';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { Event } from '../../types/event';

const { Title } = Typography;

// 历史时期定义（保持不变）
const HISTORICAL_PERIODS = [
  { key: '01', name: '鸦片战争时期', years: '1839-1860', startYear: 1839, endYear: 1860, color: '#f5222d', description: '林则徐禁烟、鸦片战争、南京条约、太平天国、第二次鸦片战争' },
  { key: '02', name: '洋务运动时期', years: '1861-1894', startYear: 1861, endYear: 1894, color: '#1890ff', description: '总理衙门设立、洋务运动推行、江南制造总局、中法战争、甲午战争爆发' },
  { key: '03', name: '甲午战后时期', years: '1895-1900', startYear: 1895, endYear: 1900, color: '#fa8c16', description: '马关条约、戊戌变法、义和团运动、八国联军、辛丑条约' },
  { key: '04', name: '清末新政时期', years: '1901-1911', startYear: 1901, endYear: 1911, color: '#52c41a', description: '清末新政、废除科举、预备立宪、徐锡麟起义、辛亥革命' },
  { key: '05', name: '民国初期', years: '1912-1926', startYear: 1912, endYear: 1926, color: '#722ed1', description: '民国成立、袁世凯称帝、五四运动、中共成立、北伐战争' },
  { key: '06', name: '国民政府时期', years: '1927-1949', startYear: 1927, endYear: 1949, color: '#eb2f96', description: '中原大战、长征、遵义会议、西安事变、抗日战争、解放战争' },
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  '战争': '#f5222d',
  '条约': '#1890ff',
  '起义': '#fa8c16',
  '改革': '#52c41a',
  '事件': '#722ed1',
};

const GROUP_COLORS: Record<string, string> = {
  '洋务派': '#2f54eb',
  '清廷': '#faad14',
  '太平天国': '#f5222d',
  '湘淮系': '#13c2c2',
  '维新派': '#52c41a',
  '革命派': '#eb2f96',
  '中国共产党': '#f5222d',
  '英军': '#1890ff',
  '国民党': '#fa8c16',
  '日本侵略军': '#722ed1',
  '解放军': '#52c41a',
  '东北军': '#13c2c2',
  '西北军': '#eb2f96',
};

export default function TimelinePage() {
  const [persons, setPersons] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [startYear, setStartYear] = useState(1839);
  const [endYear, setEndYear] = useState(1949);
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'matrix-group' | 'matrix-person' | 'group' | 'person'>('matrix-group');

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // 滚动容器 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 移动端检测
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setHeaderExpanded(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 时期选择
  useEffect(() => {
    if (selectedPeriod) {
      const period = HISTORICAL_PERIODS.find(p => p.key === selectedPeriod);
      if (period) {
        setStartYear(period.startYear);
        setEndYear(period.endYear);
      }
    }
  }, [selectedPeriod]);

  // 加载 persons 和 groups（元数据，数据量小）
  useEffect(() => {
    loadMeta();
  }, []);

  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const [personsRes, groupsRes] = await Promise.all([
        personService.list(),
        groupService.list(),
      ]);
      setPersons(personsRes);
      setGroups(groupsRes);
    } catch (e) {
      console.error(e);
    }
    setLoadingMeta(false);
  };

  // 构建查询参数
  const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {
      startYear,
      endYear,
    };
    if (searchText) params.search = searchText;
    if (eventTypeFilter.length > 0) params.eventType = eventTypeFilter[0];
    if (groupFilter.length > 0) params.groupId = groupFilter[0];
    return params;
  }, [startYear, endYear, searchText, eventTypeFilter, groupFilter]);

  // 矩阵视图：加载全部事件（不限制 pageSize）
  const [matrixEvents, setMatrixEvents] = useState<Event[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  useEffect(() => {
    if (viewMode !== 'matrix-group' && viewMode !== 'matrix-person') return;
    loadMatrixEvents();
  }, [viewMode, startYear, endYear, searchText, eventTypeFilter, groupFilter]);

  const loadMatrixEvents = async () => {
    setMatrixLoading(true);
    try {
      // 使用大 pageSize 获取当前筛选条件下的全部事件
      const result = await eventService.list({
        ...buildQueryParams(),
        page: 1,
        pageSize: 10000,
      });
      setMatrixEvents(result.data);
    } catch (e) {
      console.error(e);
    }
    setMatrixLoading(false);
  };

  // 列表视图：使用无限滚动
  const {
    items: listEvents,
    loading: listLoading,
    hasMore,
    total: listTotal,
    loadMore,
    reset: resetList,
  } = useInfiniteScroll<Event>({
    fetchFn: async (page, pageSize) => {
      return eventService.list({
        ...buildQueryParams(),
        page,
        pageSize,
      });
    },
    pageSize: 30,
    deps: [startYear, endYear, searchText, eventTypeFilter, groupFilter, viewMode],
  });

  // 滚动处理
  const handleScroll = useCallback(() => {
    if (viewMode === 'matrix-group' || viewMode === 'matrix-person') return;
    const container = scrollContainerRef.current;
    if (!container || !hasMore || listLoading) return;

    const threshold = 200;
    if (container.scrollHeight - container.scrollTop - container.clientHeight < threshold) {
      loadMore();
    }
  }, [viewMode, hasMore, listLoading, loadMore]);

  // 筛选条件变化时重置列表
  useEffect(() => {
    if (viewMode === 'group' || viewMode === 'person') {
      resetList();
    }
  }, [startYear, endYear, searchText, eventTypeFilter, groupFilter, viewMode]);

  const getPeriodByYear = (year: number): typeof HISTORICAL_PERIODS[0] | undefined => {
    return HISTORICAL_PERIODS.find(p => year >= p.startYear && year <= p.endYear);
  };

  // 筛选函数（用于列表视图的客户端二次过滤）
  const filterEventsByGroupAndPerson = (events: Event[]) => {
    return events.filter(e => {
      if (groupFilter.length > 0) {
        const eventPersonIds = e.personIds || [];
        const eventPersons = persons.filter(p => eventPersonIds.includes(p._id || p.id));
        const eventGroupIds = eventPersons.flatMap((p: any) => p.groupIds || []);
        if (!eventGroupIds.some((gid: any) => groupFilter.includes(String(gid)))) {
          return false;
        }
      }
      return true;
    });
  };

  // 按年构建矩阵数据
  const matrixByYearGroup = useMemo(() => {
    const rows: any[] = [];
    const yearsWithEvents = new Set<number>();
    matrixEvents.forEach(e => yearsWithEvents.add(new Date(e.startDate).getFullYear()));
    const sortedYears = Array.from(yearsWithEvents).sort((a, b) => a - b);

    sortedYears.forEach(year => {
      const period = getPeriodByYear(year);
      const rowData: any = { key: year, year, period };
      groups.forEach(group => {
        const groupPersons = persons.filter((p: any) => p.groupIds?.includes(group.id));
        const groupPersonIds = groupPersons.map((p: any) => p._id || p.id);
        const yearEvents = matrixEvents.filter(e => {
          const eventYear = new Date(e.startDate).getFullYear();
          return eventYear === year && e.personIds?.some(pid => groupPersonIds.includes(pid));
        });
        if (yearEvents.length > 0) rowData[group.id] = yearEvents;
      });
      rows.push(rowData);
    });
    return rows;
  }, [groups, persons, matrixEvents]);

  const matrixByYearPerson = useMemo(() => {
    const rows: any[] = [];
    const yearsWithEvents = new Set<number>();
    matrixEvents.forEach(e => yearsWithEvents.add(new Date(e.startDate).getFullYear()));
    const sortedYears = Array.from(yearsWithEvents).sort((a, b) => a - b);

    const involvedPersonIds = new Set<string>();
    matrixEvents.forEach(e => e.personIds?.forEach(pid => involvedPersonIds.add(String(pid))));
    const involvedPersons = persons.filter(p => involvedPersonIds.has(p._id || p.id)).slice(0, 30);

    sortedYears.forEach(year => {
      const period = getPeriodByYear(year);
      const rowData: any = { key: year, year, period };
      involvedPersons.forEach(person => {
        const yearEvents = matrixEvents.filter(e => {
          const eventYear = new Date(e.startDate).getFullYear();
          return eventYear === year && e.personIds?.includes(person._id || person.id);
        });
        if (yearEvents.length > 0) rowData[person._id || person.id] = yearEvents;
      });
      rows.push(rowData);
    });
    return rows;
  }, [persons, matrixEvents]);

  const matrixDataSource = useMemo(() => {
    return viewMode === 'matrix-group' ? matrixByYearGroup : matrixByYearPerson;
  }, [viewMode, matrixByYearGroup, matrixByYearPerson]);

  // 按群体分组（列表视图）
  const eventsByGroup = useMemo(() => {
    const filtered = filterEventsByGroupAndPerson(listEvents);
    const map: Record<string, { group: any; events: Event[] }> = {};
    groups.forEach(g => { map[g.id] = { group: g, events: [] }; });
    filtered.forEach(e => {
      const eventPersonIds = e.personIds || [];
      const eventPersons = persons.filter(p => eventPersonIds.includes(p._id || p.id));
      const eventGroupIds = eventPersons.flatMap((p: any) => p.groupIds || []);
      eventGroupIds.forEach((gid: any) => {
        if (map[gid]) map[gid].events.push(e);
      });
    });
    return Object.values(map).filter(g => g.events.length > 0);
  }, [listEvents, groups, persons, groupFilter]);

  // 按人物分组（列表视图）
  const eventsByPerson = useMemo(() => {
    const filtered = filterEventsByGroupAndPerson(listEvents);
    const map: Record<string, { person: any; events: Event[] }> = {};
    filtered.forEach(e => {
      const eventPersonIds = e.personIds || [];
      eventPersonIds.forEach(pid => {
        const key = String(pid);
        if (!map[key]) {
          const person = persons.find(p => String(p._id || p.id) === key);
          if (person) map[key] = { person, events: [] };
        }
        if (map[key]) map[key].events.push(e);
      });
    });
    return Object.values(map)
      .sort((a, b) => b.events.length - a.events.length)
      .slice(0, 30);
  }, [listEvents, persons]);

  // 矩阵表格列配置
  const matrixColumns = useMemo(() => {
    const periodCol = {
      title: '时期',
      dataIndex: 'period',
      key: 'period',
      fixed: 'left' as const,
      width: 40,
      render: (period: typeof HISTORICAL_PERIODS[0] | undefined, row: any) => {
        if (!period) return null;
        const year = row.year;
        if (year !== period.startYear) return null;
        const nameChars = period.name.split('');
        const yearsChars = period.years.split('');
        return (
          <div className="period-vertical-text" style={{ color: period.color, paddingTop: 4 }}>
            {nameChars.map((char, i) => (
              <span key={`name-${i}`} style={{ display: 'block', fontSize: 11, lineHeight: 1.3, fontWeight: 600 }}>{char}</span>
            ))}
            <span style={{ display: 'block', fontSize: 10, lineHeight: 1.3, marginTop: 4, fontWeight: 400, color: '#666' }}>-</span>
            {yearsChars.map((char, i) => (
              <span key={`years-${i}`} style={{ display: 'block', fontSize: 10, lineHeight: 1.2, fontWeight: 400, color: '#666' }}>{char}</span>
            ))}
          </div>
        );
      },
      onCell: (row: any) => {
        const period = getPeriodByYear(row.year);
        if (!period) return {};
        const periodYears = matrixDataSource.filter((r: any) => getPeriodByYear(r.year)?.key === period.key);
        const isFirstYear = row.year === period.startYear;
        const rowSpan = isFirstYear ? periodYears.length : 0;
        return {
          rowSpan,
          style: {
            backgroundColor: `${period.color}08`,
            borderLeft: `3px solid ${period.color}`,
            verticalAlign: 'top',
            textAlign: 'center',
            padding: '4px 2px',
            position: 'sticky',
            left: 0,
            zIndex: 10,
            background: `${period.color}08`,
          }
        };
      }
    };

    const yearCol = {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      fixed: 'left' as const,
      width: 50,
      render: (year: number) => {
        const period = getPeriodByYear(year);
        return (
          <span style={{ fontWeight: 600, color: period?.color || '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setSelectedYear(year)}>
            {year}
          </span>
        );
      },
      onCell: () => ({
        style: { position: 'sticky', left: 40, zIndex: 9, background: '#fff' }
      })
    };

    let cols: any[] = [];
    if (viewMode === 'matrix-group') {
      const groupIdsWithEvents = new Set<string>();
      matrixEvents.forEach(e => {
        const eventPersons = persons.filter(p => e.personIds?.includes(p._id || p.id));
        eventPersons.forEach((p: any) => (p.groupIds || []).forEach((gid: any) => groupIdsWithEvents.add(String(gid))));
      });
      cols = groups
        .filter(g => groupIdsWithEvents.has(String(g.id)))
        .map(group => ({
          title: <Tag color={GROUP_COLORS[group.name] || '#666'} style={{ fontSize: 12 }}>{group.name}</Tag>,
          dataIndex: group.id,
          key: group.id,
          width: 150,
          render: (events: Event[] | undefined) => {
            if (!events || events.length === 0) return null;
            return (
              <div className="matrix-cell">
                {events.map(e => (
                  <Tooltip key={e._id || e.id} title={`${e.title}\n${dayjs(e.startDate).format('M月D日')}`}>
                    <Tag color={EVENT_TYPE_COLORS[e.eventType] || '#666'} className="matrix-event-tag" onClick={() => setSelectedEvent(e)}>
                      {e.title}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            );
          }
        }));
    } else {
      const involvedPersonIds = new Set<string>();
      matrixEvents.forEach(e => e.personIds?.forEach(pid => involvedPersonIds.add(String(pid))));
      cols = persons
        .filter(p => involvedPersonIds.has(String(p._id || p.id)))
        .slice(0, 30)
        .map(person => {
          const personGroups = groups.filter((g: any) => person.groupIds?.includes(g.id));
          return {
            title: <Tooltip title={personGroups.map((g: any) => g.name).join('、')}><span style={{ fontWeight: 500 }}>{person.name}</span></Tooltip>,
            dataIndex: person._id || person.id,
            key: person._id || person.id,
            width: 100,
            render: (events: Event[] | undefined) => {
              if (!events || events.length === 0) return null;
              return (
                <div className="matrix-cell">
                  {events.map(e => (
                    <Tooltip key={e._id || e.id} title={`${e.title}\n${dayjs(e.startDate).format('M月D日')}`}>
                      <Tag color={EVENT_TYPE_COLORS[e.eventType] || '#666'} className="matrix-event-tag" onClick={() => setSelectedEvent(e)}>
                        {e.title}
                      </Tag>
                    </Tooltip>
                  ))}
                </div>
              );
            }
          };
        });
    }

    return [periodCol, yearCol, ...cols];
  }, [groups, persons, matrixEvents, viewMode, matrixDataSource]);

  // 获取事件的参与人物
  const getEventPersons = (event: Event) => {
    return persons.filter(p => event.personIds?.includes(p._id || p.id));
  };

  const getPersonGroups = (person: any) => {
    return groups.filter(g => person.groupIds?.includes(g.id));
  };

  const eventTypeOptions = useMemo(() => {
    return Object.keys(EVENT_TYPE_COLORS).map(t => ({ label: t, value: t }));
  }, []);

  const groupOptions = useMemo(() => {
    return groups.map(g => ({ label: g.name, value: String(g.id) }));
  }, [groups]);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = 1839; y <= 1949; y++) {
      years.push({ label: `${y}年`, value: y });
    }
    return years;
  }, []);

  return (
    <div className="timeline-page">
      {/* 移动端头部切换按钮 */}
      {isMobile && (
        <div className="mobile-header-toggle">
          <Button type="text" icon={headerExpanded ? <CloseOutlined /> : <MenuOutlined />}
            onClick={() => setHeaderExpanded(!headerExpanded)} style={{ fontSize: 18 }} />
          <span className="mobile-title">中国近代史时间轴</span>
        </div>
      )}

      {/* 时期概览 */}
      {(!isMobile || headerExpanded) && (
        <div className="period-overview">
          {HISTORICAL_PERIODS.map(period => (
            <Tooltip key={period.key} title={`${period.years}: ${period.description}`}>
              <div className={`period-chip ${selectedPeriod === period.key ? 'selected' : ''}`}
                style={{ backgroundColor: selectedPeriod === period.key ? period.color : `${period.color}20`, borderColor: period.color }}
                onClick={() => setSelectedPeriod(selectedPeriod === period.key ? null : period.key)}>
                <div className="period-color-bar" style={{ backgroundColor: period.color }} />
                <span className="period-name" style={{ color: selectedPeriod === period.key ? '#fff' : period.color }}>{period.name}</span>
                <span className="period-years">{period.years}</span>
              </div>
            </Tooltip>
          ))}
        </div>
      )}

      {/* 顶部筛选栏 */}
      {(!isMobile || headerExpanded) && (
        <div className="filter-bar">
          <div className="filter-left">
            <Input placeholder="搜索事件..." prefix={<SearchOutlined />}
              value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }} allowClear />
            <Select placeholder="起始年份" value={startYear}
              onChange={(v) => { setStartYear(v); setSelectedPeriod(null); }}
              options={yearOptions} style={{ width: 100 }} />
            <Select placeholder="结束年份" value={endYear}
              onChange={(v) => { setEndYear(v); setSelectedPeriod(null); }}
              options={yearOptions} style={{ width: 100 }} />
            <Select mode="multiple" placeholder="事件类型"
              value={eventTypeFilter} onChange={setEventTypeFilter}
              options={eventTypeOptions} style={{ width: 150 }} allowClear maxTagCount={2} />
            <Select mode="multiple" placeholder="群体"
              value={groupFilter} onChange={setGroupFilter}
              options={groupOptions} style={{ width: 150 }} allowClear maxTagCount={2} />
          </div>
          <div className="filter-right">
            <Space>
              <Button type={viewMode === 'matrix-group' ? 'primary' : 'default'}
                icon={<CalendarOutlined />} onClick={() => setViewMode('matrix-group')}>时间×群体</Button>
              <Button type={viewMode === 'matrix-person' ? 'primary' : 'default'}
                icon={<UserOutlined />} onClick={() => setViewMode('matrix-person')}>时间×人物</Button>
              <Button type={viewMode === 'group' ? 'primary' : 'default'}
                icon={<TeamOutlined />} onClick={() => setViewMode('group')}>按群体</Button>
              <Button type={viewMode === 'person' ? 'primary' : 'default'}
                icon={<UserOutlined />} onClick={() => setViewMode('person')}>按人物</Button>
            </Space>
          </div>
          <div className="filter-count">
            {(viewMode === 'matrix-group' || viewMode === 'matrix-person')
              ? `共 ${matrixEvents.length} 个事件`
              : `已加载 ${listEvents.length} / ${listTotal} 个事件`}
          </div>
        </div>
      )}

      {/* 颜色说明图例 */}
      {(!isMobile || headerExpanded) && (
        <div className="color-legend">
          <div className="legend-section">
            <span className="legend-title">事件类型:</span>
            {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
              <Tag key={type} color={color} style={{ fontSize: 11, margin: '2px' }}>{type}</Tag>
            ))}
          </div>
          <div className="legend-section">
            <span className="legend-title">群体:</span>
            {Object.entries(GROUP_COLORS).slice(0, 8).map(([name, color]) => (
              <Tag key={name} color={color} style={{ fontSize: 11, margin: '2px' }}>{name}</Tag>
            ))}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="timeline-content" ref={scrollContainerRef} onScroll={handleScroll}>
        {loadingMeta ? (
          <div className="loading-center"><Spin tip="加载中..." /></div>
        ) : (viewMode === 'matrix-group' || viewMode === 'matrix-person') ? (
          matrixLoading ? (
            <div className="loading-center"><Spin tip="加载事件中..." /></div>
          ) : matrixDataSource.length === 0 ? (
            <Empty description="没有找到匹配的事件" />
          ) : (
            <Table columns={matrixColumns} dataSource={matrixDataSource}
              scroll={{ x: 'max-content', y: 'calc(100vh - 140px)' }} bordered size="small" pagination={false} />
          )
        ) : (viewMode === 'group' || viewMode === 'person') ? (
          <>
            {eventsByGroup.length === 0 && eventsByPerson.length === 0 && !listLoading ? (
              <Empty description="没有找到匹配的事件" />
            ) : viewMode === 'group' ? (
              <div className="group-view">
                {eventsByGroup.map(({ group, events: grpEvents }) => (
                  <div key={group.id} className="group-section">
                    <div className="group-header">
                      <Tag color={GROUP_COLORS[group.name] || '#666'} style={{ fontSize: 14, padding: '4px 12px' }}>{group.name}</Tag>
                      <span className="group-count">{grpEvents.length} 个事件</span>
                    </div>
                    <div className="group-events">
                      {grpEvents.map(event => (
                        <div key={event._id || event.id} className="event-card-mini" onClick={() => setSelectedEvent(event)}>
                          <span className="event-year">{dayjs(event.startDate).format('YYYY年M月')}</span>
                          <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 12 }}>{event.eventType}</Tag>
                          <span className="event-title">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="person-view">
                {eventsByPerson.map(({ person, events: pEvents }) => (
                  <div key={person.id} className="person-section">
                    <div className="person-header">
                      <UserOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                      <span className="person-name">{person.name}</span>
                      {person.groupIds?.map((gid: any) => {
                        const g = groups.find((gr: any) => String(gr.id) === String(gid));
                        return g ? <Tag key={gid} color={GROUP_COLORS[g.name] || '#666'} style={{ fontSize: 12 }}>{g.name}</Tag> : null;
                      })}
                      <span className="person-count">{pEvents.length} 个事件</span>
                    </div>
                    <div className="person-events">
                      {pEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(event => (
                        <div key={event._id || event.id} className="event-card-mini" onClick={() => setSelectedEvent(event)}>
                          <span className="event-year">{dayjs(event.startDate).format('YYYY年M月')}</span>
                          <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 12 }}>{event.eventType}</Tag>
                          <span className="event-title">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* 无限滚动加载指示器 */}
            {listLoading && (
              <div className="loading-indicator"><Spin tip="加载更多..." /></div>
            )}
            {!hasMore && listEvents.length > 0 && (
              <div className="no-more">— 已加载全部 {listTotal} 个事件 —</div>
            )}
          </>
        ) : null}
      </div>

      {/* 事件详情抽屉 */}
      <Drawer title={selectedEvent?.title} placement="right" width={500}
        open={!!selectedEvent} onClose={() => setSelectedEvent(null)}
        extra={
          <Link to={`/event/${selectedEvent?._id || selectedEvent?.id}`}>
            <Button icon={<ExperimentOutlined />} size="small">影响力分析</Button>
          </Link>
        }>
        {selectedEvent && (
          <div className="event-detail">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="时间">{dayjs(selectedEvent.startDate).format('YYYY年M月D日')}</Descriptions.Item>
              <Descriptions.Item label="类型"><Tag color={EVENT_TYPE_COLORS[selectedEvent.eventType]}>{selectedEvent.eventType}</Tag></Descriptions.Item>
              {selectedEvent.location && <Descriptions.Item label="地点">{selectedEvent.location}</Descriptions.Item>}
              <Descriptions.Item label="概述">{selectedEvent.summary}</Descriptions.Item>
            </Descriptions>
            <Title level={5} style={{ marginTop: 16 }}>详细内容</Title>
            <Descriptions column={1} size="small">
              {selectedEvent.detail?.motive && <Descriptions.Item label="动机">{selectedEvent.detail.motive}</Descriptions.Item>}
              {selectedEvent.detail?.process && <Descriptions.Item label="经过">{selectedEvent.detail.process}</Descriptions.Item>}
              {selectedEvent.detail?.result && <Descriptions.Item label="结果">{selectedEvent.detail.result}</Descriptions.Item>}
              {selectedEvent.detail?.impact && <Descriptions.Item label="影响">{selectedEvent.detail.impact}</Descriptions.Item>}
            </Descriptions>
            <Title level={5} style={{ marginTop: 16 }}>参与人物</Title>
            <div className="person-list">
              {getEventPersons(selectedEvent).map(person => (
                <div key={person.id} className="person-item">
                  <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <span className="person-name">{person.name}</span>
                  {getPersonGroups(person).map(g => (
                    <Tag key={g.id} color={GROUP_COLORS[g.name]} style={{ marginLeft: 8 }}>{g.name}</Tag>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* 年份事件列表抽屉 */}
      <Drawer title={`${selectedYear}年事件列表`} placement="right" width={400}
        open={!!selectedYear} onClose={() => setSelectedYear(null)}>
        {selectedYear && (
          <div className="year-event-list">
            {(viewMode === 'matrix-group' || viewMode === 'matrix-person' ? matrixEvents : listEvents)
              .filter(e => new Date(e.startDate).getFullYear() === selectedYear)
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map(event => (
                <div key={event._id || event.id} className="year-event-item"
                  onClick={() => { setSelectedYear(null); setSelectedEvent(event); }}>
                  <div className="year-event-date">{dayjs(event.startDate).format('M月D日')}</div>
                  <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 12 }}>{event.eventType}</Tag>
                  <div className="year-event-title">{event.title}</div>
                </div>
              ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
```

- [ ] **Step 2: 添加加载指示器 CSS**

在 `frontend/src/pages/TimelinePage/index.css` 末尾添加：

```css
/* 无限滚动加载指示器 */
.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  color: #1890ff;
}

.no-more {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 12px 0;
}
```

- [ ] **Step 3: 验证前端编译**

Run: `cd /Users/zhangrz/code/github/mch-prc/frontend && yarn build`
Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
cd /Users/zhangrz/code/github/mch-prc
git add frontend/src/pages/TimelinePage/index.tsx frontend/src/pages/TimelinePage/index.css frontend/src/hooks/useInfiniteScroll.ts
git commit -m "feat(frontend): TimelinePage 集成 API + 无限滚动加载"
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 启动后端**

```bash
cd /Users/zhangrz/code/github/mch-prc/backend
yarn start:dev
```

确认后端在 `http://localhost:3000` 运行，访问 `http://localhost:3000/api/events?page=1&pageSize=5` 确认返回分页数据。

- [ ] **Step 2: 启动前端**

```bash
cd /Users/zhangrz/code/github/mch-prc/frontend
yarn dev
```

确认前端在 `http://localhost:5173` 运行。

- [ ] **Step 3: 验证功能**

1. 矩阵视图（时间×群体）：显示事件矩阵，数据来自 API
2. 矩阵视图（时间×人物）：显示事件矩阵
3. 按群体视图：列表显示，滚动到底部自动加载下一页
4. 按人物视图：列表显示，滚动到底部自动加载下一页
5. 筛选功能：切换年份、事件类型、群体时，列表自动重置并重新加载
6. 事件详情：点击事件打开抽屉，显示详情
7. 搜索：输入搜索词后列表重新加载

- [ ] **Step 4: 最终提交（如有需要）**

---

## 风险与注意事项

1. **MongoDB ObjectId 与前端数字 ID 的兼容性**：旧 JSON 使用数字 ID，MongoDB 使用 ObjectId 字符串。前端已统一为 `_id || id` 兼容两种方式。
2. **矩阵视图不适合分页**：矩阵需要完整数据集按年和群体/人物交叉聚合，因此矩阵视图使用 `pageSize: 10000` 获取全部数据。列表视图才使用无限滚动。
3. **筛选参数映射**：前端的 `groupFilter` 是多选的，但后端 `groupId` 只支持单值。如需支持多群体筛选，后端需扩展 `groupId` 为数组。当前实现只取第一个值。

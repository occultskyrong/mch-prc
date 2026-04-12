# mch-prc 前端实施计划 (Phase 3-6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建 React 前端应用，实现时间轴矩阵可视化和管理后台

**Architecture:** SPA + Ant Design UI，Axios 调用后端 API，React Router 路由管理

**Tech Stack:** React + TypeScript + Ant Design + Vite + Axios

---

## Task 1: 项目初始化

- [ ] **Step 1: 创建 React 项目**

```bash
cd m:/jiachen/mch-prc
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install antd axios react-router-dom @ant-design/icons dayjs
```

- [ ] **Step 2: 配置 Vite**

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: 提交**

```bash
git add .
git commit -m "init: React frontend scaffold with Ant Design"
```

---

## Task 2: API 服务层

- [ ] **Step 1: 创建 Axios 配置**

```typescript
// frontend/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export default api;
```

- [ ] **Step 2: 创建类型定义**

```typescript
// frontend/src/types/event.ts
export interface Event {
  id: number;
  title: string;
  startDate: string;
  endDate?: string;
  isInstant: boolean;
  eventType: string;
  summary?: { content: string };
  detail?: { motive: string; process: string; result: string; impact: string };
}

export interface EventListParams {
  page?: number;
  pageSize?: number;
  title?: string;
  eventType?: string;
}

// frontend/src/types/group.ts
export interface Group {
  id: number;
  name: string;
  parentId?: number;
  type: string;
  description?: string;
}

// frontend/src/types/person.ts
export interface Person {
  id: number;
  name: string;
  birthYear?: number;
  deathYear?: number;
  gender?: string;
  bioSummary?: string;
}

// frontend/src/types/timeline.ts
export interface TimelineMatrix {
  columns: string[];
  rows: TimelineRow[];
}

export interface TimelineRow {
  id: number;
  name: string;
  type: 'group' | 'person';
  events: TimelineEvent[];
}

export interface TimelineEvent {
  eventId: number;
  title: string;
  year: string;
}
```

- [ ] **Step 3: 创建服务函数**

```typescript
// frontend/src/services/eventService.ts
import api from './api';
import { Event, EventListParams } from '../types/event';

export const eventService = {
  list: (params: EventListParams) => api.get<{ data: Event[]; count: number }>('/event/list', { params }),
  findById: (id: number) => api.get<Event>(`/event/${id}`),
  create: (data: Partial<Event>) => api.post<Event>('/event', data),
  update: (data: Partial<Event>) => api.put<Event>('/event', data),
  delete: (id: number) => api.delete(`/event/${id}`),
};

// frontend/src/services/groupService.ts
import api from './api';
import { Group } from '../types/group';

export const groupService = {
  list: () => api.get<{ data: Group[] }>('/group/list'),
  tree: () => api.get<Group[]>('/group/tree'),
  findById: (id: number) => api.get<Group>(`/group/${id}`),
  create: (data: Partial<Group>) => api.post<Group>('/group', data),
};

// frontend/src/services/personService.ts
import api from './api';
import { Person } from '../types/person';

export const personService = {
  list: () => api.get<{ data: Person[] }>('/person/list'),
  findById: (id: number) => api.get<Person>(`/person/${id}`),
  create: (data: Partial<Person>) => api.post<Person>('/person', data),
};

// frontend/src/services/timelineService.ts
import api from './api';
import { TimelineMatrix } from '../types/timeline';

export const timelineService = {
  getMatrix: (startDate: string, endDate: string, groupBy: 'group' | 'person') =>
    api.get<TimelineMatrix>('/timeline/matrix', { params: { startDate, endDate, groupBy } }),
};
```

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: API service layer"
```

---

## Task 3: 路与布局

- [ ] **Step 1: 创建路由配置**

```typescript
// frontend/src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import TimelinePage from '../pages/TimelinePage';
import EventDetailPage from '../pages/EventDetailPage';
import PersonDetailPage from '../pages/PersonDetailPage';
import GroupDetailPage from '../pages/GroupDetailPage';
import AdminLayout from '../pages/admin/AdminLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'event/:id', element: <EventDetailPage /> },
      { path: 'person/:id', element: <PersonDetailPage /> },
      { path: 'group/:id', element: <GroupDetailPage /> },
      { path: 'admin', element: <AdminLayout /> },
    ],
  },
]);
```

- [ ] **Step 2: 创建布局组件**

```typescript
// frontend/src/components/Layout/index.tsx
import { Outlet, Link } from 'react-router-dom';
import { Menu } from 'antd';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Menu mode="horizontal">
        <Menu.Item key="timeline"><Link to="/timeline">时间轴</Link></Menu.Item>
        <Menu.Item key="admin"><Link to="/admin">管理</Link></Menu.Item>
      </Menu>
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 3: 修改入口**

```typescript
// frontend/src/App.tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: routing and layout"
```

---

## Task 4: 时间轴矩阵页（核心）

- [ ] **Step 1: 创建页面组件**

```typescript
// frontend/src/pages/TimelinePage/index.tsx
import { useState, useEffect } from 'react';
import { DatePicker, Select, Switch, Table, Card, Spin } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { timelineService } from '../../services/timelineService';
import { TimelineMatrix, TimelineRow } from '../../types/timeline';

export default function TimelinePage() {
  const [startDate, setStartDate] = useState(dayjs('1840-01-01'));
  const [endDate, setEndDate] = useState(dayjs('1949-12-31'));
  const [groupBy, setGroupBy] = useState<'group' | 'person'>('group');
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState<TimelineMatrix | null>(null);

  useEffect(() => {
    loadMatrix();
  }, [startDate, endDate, groupBy]);

  const loadMatrix = async () => {
    setLoading(true);
    const res = await timelineService.getMatrix(
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD'),
      groupBy
    );
    setMatrix(res.data);
    setLoading(false);
  };

  const columns = matrix?.columns.map(year => ({
    title: year,
    dataIndex: year,
    key: year,
    render: (events: any[]) => events?.map(e => (
      <Link key={e.eventId} to={`/event/${e.eventId}`}>{e.title}</Link>
    )),
  })) || [];

  const dataSource = matrix?.rows.map(row => {
    const item: any = { key: row.id, name: row.name };
    row.events.forEach(e => {
      item[e.year] = [...(item[e.year] || []), e];
    });
    return item;
  }) || [];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <DatePicker value={startDate} onChange={(d) => setStartDate(d!)} picker="year" />
        <DatePicker value={endDate} onChange={(d) => setEndDate(d!)} picker="year" />
        <Select value={groupBy} onChange={setGroupBy} options={[
          { value: 'group', label: '按群体' },
          { value: 'person', label: '按人物' },
        ]} />
      </div>
      {loading ? <Spin /> : (
        <Table
          columns={[{ title: '名称', dataIndex: 'name', fixed: 'left' }, ...columns]}
          dataSource={dataSource}
          scroll={{ x: 'max-content' }}
          bordered
        />
      )}
    </Card>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add .
git commit -m "feat: timeline matrix page"
```

---

## Task 5: 事件详情页

- [ ] **Step 1: 创建页面组件**

```typescript
// frontend/src/pages/EventDetailPage/index.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Spin, Tag } from 'antd';
import { eventService } from '../../services/eventService';
import { Event } from '../../types/event';

export default function EventDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (id) loadEvent(Number(id));
  }, [id]);

  const loadEvent = async (eventId: number) => {
    const res = await eventService.findById(eventId);
    setEvent(res.data);
    setLoading(false);
  };

  if (loading) return <Spin />;
  if (!event) return <div>未找到事件</div>;

  return (
    <Card title={event.title}>
      <Descriptions bordered>
        <Descriptions.Item label="时间">{event.startDate} ~ {event.endDate || '瞬间事件'}</Descriptions.Item>
        <Descriptions.Item label="类型"><Tag>{event.eventType}</Tag></Descriptions.Item>
      </Descriptions>
      {event.summary && (
        <Card title="摘要" style={{ marginTop: 16 }}>
          {event.summary.content}
        </Card>
      )}
      {event.detail && (
        <Card title="详情" style={{ marginTop: 16 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="动机">{event.detail.motive}</Descriptions.Item>
            <Descriptions.Item label="经过">{event.detail.process}</Descriptions.Item>
            <Descriptions.Item label="结果">{event.detail.result}</Descriptions.Item>
            <Descriptions.Item label="影响">{event.detail.impact}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
      <Link to="/timeline">返回时间轴</Link>
    </Card>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add .
git commit -m "feat: event detail page"
```

---

## Task 6: 人物详情页

- [ ] **Step 1: 创建页面组件**

```typescript
// frontend/src/pages/PersonDetailPage/index.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Spin } from 'antd';
import { personService } from '../../services/personService';
import { Person } from '../../types/person';

export default function PersonDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);

  useEffect(() => {
    if (id) loadPerson(Number(id));
  }, [id]);

  const loadPerson = async (personId: number) => {
    const res = await personService.findById(personId);
    setPerson(res.data);
    setLoading(false);
  };

  if (loading) return <Spin />;
  if (!person) return <div>未找到人物</div>;

  return (
    <Card title={person.name}>
      <Descriptions bordered>
        <Descriptions.Item label="生卒年">{person.birthYear} - {person.deathYear}</Descriptions.Item>
        <Descriptions.Item label="性别">{person.gender}</Descriptions.Item>
      </Descriptions>
      {person.bioSummary && (
        <Card title="生平简介" style={{ marginTop: 16 }}>{person.bioSummary}</Card>
      )}
      <Link to="/timeline">返回时间轴</Link>
    </Card>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add .
git commit -m "feat: person detail page"
```

---

## Task 7: 群体详情页

- [ ] **Step 1: 创建页面组件**

```typescript
// frontend/src/pages/GroupDetailPage/index.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Spin, Tag } from 'antd';
import { groupService } from '../../services/groupService';
import { Group } from '../../types/group';

export default function GroupDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (id) loadGroup(Number(id));
  }, [id]);

  const loadGroup = async (groupId: number) => {
    const res = await groupService.findById(groupId);
    setGroup(res.data);
    setLoading(false);
  };

  if (loading) return <Spin />;
  if (!group) return <div>未找到群体</div>;

  return (
    <Card title={group.name}>
      <Descriptions bordered>
        <Descriptions.Item label="类型"><Tag>{group.type}</Tag></Descriptions.Item>
        <Descriptions.Item label="父群体">{group.parentId}</Descriptions.Item>
      </Descriptions>
      {group.description && (
        <Card title="描述" style={{ marginTop: 16 }}>{group.description}</Card>
      )}
      <Link to="/timeline">返回时间轴</Link>
    </Card>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add .
git commit -m "feat: group detail page"
```

---

## Task 8: 管理后台

- [ ] **Step 1: 创建管理布局**

```typescript
// frontend/src/pages/admin/AdminLayout.tsx
import { Outlet, Link } from 'react-router-dom';
import { Menu, Layout } from 'antd';

const { Sider, Content } = Layout;

export default function AdminLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <Menu mode="inline">
          <Menu.Item key="event"><Link to="/admin/event">事件管理</Link></Menu.Item>
          <Menu.Item key="person"><Link to="/admin/person">人物管理</Link></Menu.Item>
          <Menu.Item key="group"><Link to="/admin/group">群体管理</Link></Menu.Item>
        </Menu>
      </Sider>
      <Content><Outlet /></Content>
    </Layout>
  );
}
```

- [ ] **Step 2: 创建事件管理页**

```typescript
// frontend/src/pages/admin/EventManage/index.tsx
import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Space } from 'antd';
import { eventService } from '../../../services/eventService';
import { Event } from '../../../types/event';

export default function EventManage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const res = await eventService.list({});
    setEvents(res.data.data);
    setLoading(false);
  };

  const handleCreate = async (values: any) => {
    await eventService.create({
      ...values,
      startDate: values.startDate.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
    });
    setModalVisible(false);
    form.resetFields();
    loadEvents();
  };

  return (
    <div style={{ padding: 24 }}>
      <Button type="primary" onClick={() => setModalVisible(true)}>新增事件</Button>
      <Table
        loading={loading}
        dataSource={events}
        columns={[
          { title: '标题', dataIndex: 'title' },
          { title: '时间', dataIndex: 'startDate' },
          { title: '类型', dataIndex: 'eventType' },
          {
            title: '操作',
            render: (r: Event) => (
              <Space>
                <Button onClick={() => eventService.delete(r.id).then(loadEvents)}>删除</Button>
              </Space>
            ),
          },
        ]}
        rowKey="id"
      />
      <Modal title="新增事件" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="startDate" label="开始时间" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="endDate" label="结束时间">
            <DatePicker />
          </Form.Item>
          <Form.Item name="eventType" label="类型">
            <Select options={[
              { value: '战争', label: '战争' },
              { value: '条约', label: '条约' },
              { value: '运动', label: '运动' },
              { value: '起义', label: '起义' },
              { value: '改革', label: '改革' },
            ]} />
          </Form.Item>
          <Form.Item name="summaryContent" label="摘要">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: 创建人物管理页（类似结构）**

```typescript
// frontend/src/pages/admin/PersonManage/index.tsx
// 与 EventManage 类似，使用 personService
```

- [ ] **Step 4: 创建群体管理页（类似结构）**

```typescript
// frontend/src/pages/admin/GroupManage/index.tsx
// 与 EventManage 类似，使用 groupService
```

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: admin management pages"
```

---

## Task 9: 验证与启动

- [ ] **Step 1: 启动前端**

```bash
cd frontend
npm run dev
```

- [ ] **Step 2: 验证页面**

访问 http://localhost:5173/timeline 检查时间轴页面是否正常加载。

- [ ] **Step 3: 提交**

```bash
git add .
git commit -m "test: frontend verification"
```

---

*前端计划完成，待执行*
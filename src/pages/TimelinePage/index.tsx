import { useState, useEffect, useMemo } from 'react';
import { Select, Input, Tag, Drawer, Descriptions, Typography, Space, Button, Tooltip, Empty, Table, Divider, Segmented } from 'antd';
import { SearchOutlined, CalendarOutlined, UserOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './index.css';
import { eventService } from '../../services/eventService';
import { personService } from '../../services/personService';
import { groupService } from '../../services/groupService';
import { Event } from '../../types/event';

const { Title } = Typography;

// 历史时期定义
const HISTORICAL_PERIODS = [
  { key: '01', name: '鸦片战争时期', years: '1839-1860', startYear: 1839, endYear: 1860, color: '#f5222d', description: '林则徐禁烟、鸦片战争、南京条约、太平天国、第二次鸦片战争' },
  { key: '02', name: '洋务运动时期', years: '1861-1894', startYear: 1861, endYear: 1894, color: '#1890ff', description: '总理衙门设立、洋务运动推行、江南制造总局、中法战争、甲午战争爆发' },
  { key: '03', name: '甲午战后时期', years: '1895-1900', startYear: 1895, endYear: 1900, color: '#fa8c16', description: '马关条约、戊戌变法、义和团运动、八国联军、辛丑条约' },
  { key: '04', name: '清末新政时期', years: '1901-1911', startYear: 1901, endYear: 1911, color: '#52c41a', description: '清末新政、废除科举、预备立宪、徐锡麟起义、辛亥革命' },
  { key: '05', name: '民国初期', years: '1912-1927', startYear: 1912, endYear: 1927, color: '#722ed1', description: '民国成立、袁世凯称帝、五四运动、中共成立、北伐战争' },
  { key: '06', name: '国民政府时期', years: '1927-1949', startYear: 1927, endYear: 1949, color: '#eb2f96', description: '中原大战、长征、遵义会议、西安事变、抗日战争、解放战争' },
];

// 事件类型颜色映射
const EVENT_TYPE_COLORS: Record<string, string> = {
  '战争': '#f5222d',
  '条约': '#1890ff',
  '起义': '#fa8c16',
  '改革': '#52c41a',
  '事件': '#722ed1',
};

// 群体颜色映射
const GROUP_COLORS: Record<string, string> = {
  '洋务派': '#2f54eb',
  '清廷': '#faad14',
  '太平天国': '#f5222d',
  '湘淮系': '#13c2c2',
  '维新派': '#52c41a',
  '革命派': '#eb2f96',
  '中国共产党': '#f5222d',
  '英军': '#1890ff',
};

export default function TimelinePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选条件
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [startYear, setStartYear] = useState(1839);
  const [endYear, setEndYear] = useState(1949);
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'matrix-group' | 'matrix-person' | 'group' | 'person'>('matrix-group');

  // 详情抽屉
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // 当选择时期时，自动设置年份范围
  useEffect(() => {
    if (selectedPeriod) {
      const period = HISTORICAL_PERIODS.find(p => p.key === selectedPeriod);
      if (period) {
        setStartYear(period.startYear);
        setEndYear(period.endYear);
      }
    }
  }, [selectedPeriod]);

  // 根据年份获取所属时期
  const getPeriodByYear = (year: number): typeof HISTORICAL_PERIODS[0] | undefined => {
    return HISTORICAL_PERIODS.find(p => year >= p.startYear && year <= p.endYear);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, personsRes, groupsRes] = await Promise.all([
        eventService.list({ pageSize: 1000 }),
        personService.list(),
        groupService.list(),
      ]);
      setEvents(eventsRes.data);
      setPersons(personsRes.data);
      setGroups(groupsRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // 筛选后的事件
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const year = new Date(e.startDate).getFullYear();

      // 年份范围
      if (year < startYear || year > endYear) return false;

      // 搜索文本
      if (searchText && !e.title.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }

      // 事件类型
      if (eventTypeFilter.length > 0 && !eventTypeFilter.includes(e.eventType)) {
        return false;
      }

      // 群体筛选
      if (groupFilter.length > 0) {
        const eventPersonIds = e.personIds || [];
        const eventPersons = persons.filter(p => eventPersonIds.includes(p.id));
        const eventGroupIds = eventPersons.flatMap(p => p.groupIds || []);
        if (!eventGroupIds.some(gid => groupFilter.includes(gid))) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, startYear, endYear, searchText, eventTypeFilter, groupFilter, persons]);

  // 生成年份列
  const yearColumns = useMemo(() => {
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [startYear, endYear]);

  // 按年份构建矩阵数据（时间上下，群体左右）
  const matrixByYearGroup = useMemo(() => {
    const rows: any[] = [];

    // 只显示有事件的年份
    const yearsWithEvents = new Set<number>();
    filteredEvents.forEach(e => {
      yearsWithEvents.add(new Date(e.startDate).getFullYear());
    });

    // 按年份排序
    const sortedYears = Array.from(yearsWithEvents).sort((a, b) => a - b);

    sortedYears.forEach(year => {
      const period = getPeriodByYear(year);
      const rowData: any = {
        key: year,
        year: year,
        period: period,
      };

      // 每个群体的该年事件
      groups.forEach(group => {
        const groupPersons = persons.filter(p => p.groupIds?.includes(group.id));
        const groupPersonIds = groupPersons.map(p => p.id);

        const yearEvents = filteredEvents.filter(e => {
          const eventYear = new Date(e.startDate).getFullYear();
          return eventYear === year && e.personIds?.some(pid => groupPersonIds.includes(pid));
        });

        if (yearEvents.length > 0) {
          rowData[group.id] = yearEvents;
        }
      });

      rows.push(rowData);
    });

    return rows;
  }, [groups, persons, filteredEvents]);

  // 按年份构建矩阵数据（时间上下，人物左右）
  const matrixByYearPerson = useMemo(() => {
    const rows: any[] = [];

    // 只显示有事件的年份
    const yearsWithEvents = new Set<number>();
    filteredEvents.forEach(e => {
      yearsWithEvents.add(new Date(e.startDate).getFullYear());
    });

    const sortedYears = Array.from(yearsWithEvents).sort((a, b) => a - b);

    // 只显示参与了筛选事件的人物
    const involvedPersonIds = new Set<number>();
    filteredEvents.forEach(e => {
      e.personIds?.forEach(pid => involvedPersonIds.add(pid));
    });
    const involvedPersons = persons.filter(p => involvedPersonIds.has(p.id)).slice(0, 30);

    sortedYears.forEach(year => {
      const period = getPeriodByYear(year);
      const rowData: any = {
        key: year,
        year: year,
        period: period,
      };

      // 每个人物的该年事件
      involvedPersons.forEach(person => {
        const yearEvents = filteredEvents.filter(e => {
          const eventYear = new Date(e.startDate).getFullYear();
          return eventYear === year && e.personIds?.includes(person.id);
        });

        if (yearEvents.length > 0) {
          rowData[person.id] = yearEvents;
        }
      });

      rows.push(rowData);
    });

    return rows;
  }, [persons, filteredEvents]);

  // 按群体分组（列表视图）
  const eventsByGroup = useMemo(() => {
    const map: Record<number, { group: any; events: Event[] }> = {};
    groups.forEach(g => {
      map[g.id] = { group: g, events: [] };
    });

    filteredEvents.forEach(e => {
      const eventPersonIds = e.personIds || [];
      const eventPersons = persons.filter(p => eventPersonIds.includes(p.id));
      const eventGroupIds = eventPersons.flatMap(p => p.groupIds || []);
      eventGroupIds.forEach(gid => {
        if (map[gid]) {
          map[gid].events.push(e);
        }
      });
    });

    return Object.values(map).filter(g => g.events.length > 0);
  }, [filteredEvents, groups, persons]);

  // 按人物分组（列表视图）
  const eventsByPerson = useMemo(() => {
    const map: Record<number, { person: any; events: Event[] }> = {};

    filteredEvents.forEach(e => {
      const eventPersonIds = e.personIds || [];
      eventPersonIds.forEach(pid => {
        if (!map[pid]) {
          const person = persons.find(p => p.id === pid);
          if (person) {
            map[pid] = { person, events: [] };
          }
        }
        if (map[pid]) {
          map[pid].events.push(e);
        }
      });
    });

    return Object.values(map)
      .sort((a, b) => b.events.length - a.events.length)
      .slice(0, 30);
  }, [filteredEvents, persons]);

  // 获取事件的参与人物
  const getEventPersons = (event: Event) => {
    return persons.filter(p => event.personIds?.includes(p.id));
  };

  // 获取人物的群体
  const getPersonGroups = (person: any) => {
    return groups.filter(g => person.groupIds?.includes(g.id));
  };

  // 事件类型选项
  const eventTypeOptions = useMemo(() => {
    const types = [...new Set(events.map(e => e.eventType))];
    return types.map(t => ({ label: t, value: t }));
  }, [events]);

  // 群体选项
  const groupOptions = useMemo(() => {
    return groups.map(g => ({ label: g.name, value: g.id }));
  }, [groups]);

  // 年份范围选项
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = 1839; y <= 1949; y++) {
      years.push({ label: `${y}年`, value: y });
    }
    return years;
  }, []);

  // 时期选项
  const periodOptions = useMemo(() => {
    return HISTORICAL_PERIODS.map(p => ({
      label: p.name,
      value: p.key,
      description: p.description,
      years: p.years,
    }));
  }, []);

  // 矩阵表格列配置（时间上下，群体/人物左右）
  const matrixColumns = useMemo(() => {
    // 时期列（左侧固定，显示时期名称）
    const periodCol = {
      title: '时期',
      dataIndex: 'period',
      key: 'period',
      fixed: 'left' as const,
      width: 90,
      render: (period: typeof HISTORICAL_PERIODS[0] | undefined, row: any) => {
        if (!period) return null;
        // 只在每个时期的第一年显示时期名称
        const year = row.year;
        if (year !== period.startYear) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0' }}>
            <span style={{ fontWeight: 600, color: period.color, fontSize: 12, lineHeight: 1.2 }}>{period.name}</span>
            <span style={{ color: '#666', fontSize: 11, lineHeight: 1.2 }}>{period.years}</span>
          </div>
        );
      },
      onCell: (row: any) => {
        const period = getPeriodByYear(row.year);
        if (!period) return {};
        // 合并同一时期的单元格
        const periodYears = matrixDataSource.filter(r => getPeriodByYear(r.year)?.key === period.key);
        const isFirstYear = row.year === period.startYear;
        const rowSpan = isFirstYear ? periodYears.length : 0;
        return {
          rowSpan,
          style: { backgroundColor: `${period.color}08`, borderLeft: `3px solid ${period.color}`, verticalAlign: 'top' }
        };
      }
    };

    // 年份列（第二列）
    const yearCol = {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      fixed: 'left' as const,
      width: 60,
      render: (year: number) => {
        const period = getPeriodByYear(year);
        return (
          <span style={{ fontWeight: 600, color: period?.color || '#1890ff' }}>{year}</span>
        );
      }
    };

    // 群体/人物列
    let cols: any[] = [];
    if (viewMode === 'matrix-group') {
      // 只显示有事件的群体
      const groupIdsWithEvents = new Set<number>();
      filteredEvents.forEach(e => {
        const eventPersons = persons.filter(p => e.personIds?.includes(p.id));
        eventPersons.forEach(p => {
          p.groupIds?.forEach(gid => groupIdsWithEvents.add(gid));
        });
      });

      cols = groups
        .filter(g => groupIdsWithEvents.has(g.id))
        .map(group => ({
          title: (
            <Tag color={GROUP_COLORS[group.name] || '#666'} style={{ fontSize: 12 }}>
              {group.name}
            </Tag>
          ),
          dataIndex: group.id,
          key: group.id,
          width: 150,
          render: (events: Event[] | undefined) => {
            if (!events || events.length === 0) return null;
            return (
              <div className="matrix-cell">
                {events.map(e => (
                  <Tooltip
                    key={e.id}
                    title={`${e.title}\n${dayjs(e.startDate).format('M月D日')}`}
                  >
                    <Tag
                      color={EVENT_TYPE_COLORS[e.eventType] || '#666'}
                      className="matrix-event-tag"
                      onClick={() => setSelectedEvent(e)}
                    >
                      {e.title}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            );
          }
        }));
    } else {
      // 人物视图
      const involvedPersonIds = new Set<number>();
      filteredEvents.forEach(e => {
        e.personIds?.forEach(pid => involvedPersonIds.add(pid));
      });

      cols = persons
        .filter(p => involvedPersonIds.has(p.id))
        .slice(0, 30)
        .map(person => {
          const personGroups = getPersonGroups(person);
          return {
            title: (
              <Tooltip title={personGroups.map(g => g.name).join('、')}>
                <span style={{ fontWeight: 500 }}>{person.name}</span>
              </Tooltip>
            ),
            dataIndex: person.id,
            key: person.id,
            width: 100,
            render: (events: Event[] | undefined) => {
              if (!events || events.length === 0) return null;
              return (
                <div className="matrix-cell">
                  {events.map(e => (
                    <Tooltip
                      key={e.id}
                      title={`${e.title}\n${dayjs(e.startDate).format('M月D日')}`}
                    >
                      <Tag
                        color={EVENT_TYPE_COLORS[e.eventType] || '#666'}
                        className="matrix-event-tag"
                        onClick={() => setSelectedEvent(e)}
                      >
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
  }, [groups, persons, filteredEvents, viewMode]);

  // 矩阵数据源
  const matrixDataSource = useMemo(() => {
    return viewMode === 'matrix-group' ? matrixByYearGroup : matrixByYearPerson;
  }, [viewMode, matrixByYearGroup, matrixByYearPerson]);

  return (
    <div className="timeline-page">
      {/* 时期概览 */}
      <div className="period-overview">
        {HISTORICAL_PERIODS.map(period => (
          <Tooltip key={period.key} title={`${period.years}: ${period.description}`}>
            <div
              className={`period-chip ${selectedPeriod === period.key ? 'selected' : ''}`}
              style={{ backgroundColor: selectedPeriod === period.key ? period.color : `${period.color}20`, borderColor: period.color }}
              onClick={() => setSelectedPeriod(selectedPeriod === period.key ? null : period.key)}
            >
              <div className="period-color-bar" style={{ backgroundColor: period.color }} />
              <span className="period-name" style={{ color: selectedPeriod === period.key ? '#fff' : period.color }}>{period.name}</span>
              <span className="period-years">{period.years}</span>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* 顶部筛选栏 */}
      <div className="filter-bar">
        <div className="filter-left">
          <Input
            placeholder="搜索事件..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />

          <Select
            placeholder="起始年份"
            value={startYear}
            onChange={(v) => { setStartYear(v); setSelectedPeriod(null); }}
            options={yearOptions}
            style={{ width: 100 }}
          />

          <Select
            placeholder="结束年份"
            value={endYear}
            onChange={(v) => { setEndYear(v); setSelectedPeriod(null); }}
            options={yearOptions}
            style={{ width: 100 }}
          />

          <Select
            mode="multiple"
            placeholder="事件类型"
            value={eventTypeFilter}
            onChange={setEventTypeFilter}
            options={eventTypeOptions}
            style={{ width: 150 }}
            allowClear
            maxTagCount={2}
          />

          <Select
            mode="multiple"
            placeholder="群体"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groupOptions}
            style={{ width: 150 }}
            allowClear
            maxTagCount={2}
          />
        </div>

        <div className="filter-right">
          <Space>
            <Button
              type={viewMode === 'matrix-group' ? 'primary' : 'default'}
              icon={<CalendarOutlined />}
              onClick={() => setViewMode('matrix-group')}
            >
              时间×群体
            </Button>
            <Button
              type={viewMode === 'matrix-person' ? 'primary' : 'default'}
              icon={<UserOutlined />}
              onClick={() => setViewMode('matrix-person')}
            >
              时间×人物
            </Button>
            <Button
              type={viewMode === 'group' ? 'primary' : 'default'}
              icon={<TeamOutlined />}
              onClick={() => setViewMode('group')}
            >
              按群体
            </Button>
            <Button
              type={viewMode === 'person' ? 'primary' : 'default'}
              icon={<UserOutlined />}
              onClick={() => setViewMode('person')}
            >
              按人物
            </Button>
          </Space>
        </div>

        <div className="filter-count">
          共 {filteredEvents.length} 个事件
        </div>
      </div>

      {/* 主内容区 */}
      <div className="timeline-content">
        {loading ? (
          <div className="loading-center">加载中...</div>
        ) : filteredEvents.length === 0 ? (
          <Empty description="没有找到匹配的事件" />
        ) : viewMode === 'matrix-group' || viewMode === 'matrix-person' ? (
          /* 矩阵视图 */
          <Table
            columns={matrixColumns}
            dataSource={matrixDataSource}
            scroll={{ x: 'max-content', y: 'calc(100vh - 180px)' }}
            bordered
            size="small"
            pagination={false}
          />
        ) : viewMode === 'group' ? (
          /* 群体列表视图 */
          <div className="group-view">
            {eventsByGroup.map(({ group, events }) => (
              <div key={group.id} className="group-section">
                <div className="group-header">
                  <Tag color={GROUP_COLORS[group.name] || '#666'} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {group.name}
                  </Tag>
                  <span className="group-count">{events.length} 个事件</span>
                </div>
                <div className="group-events">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className="event-card-mini"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <span className="event-year">{dayjs(event.startDate).format('YYYY年M月')}</span>
                      <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 12 }}>
                        {event.eventType}
                      </Tag>
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 人物列表视图 */
          <div className="person-view">
            {eventsByPerson.map(({ person, events }) => (
              <div key={person.id} className="person-section">
                <div className="person-header">
                  <UserOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                  <span className="person-name">{person.name}</span>
                  {person.groupIds?.map((gid: number) => {
                    const g = groups.find(gr => gr.id === gid);
                    return g ? (
                      <Tag key={gid} color={GROUP_COLORS[g.name] || '#666'} style={{ fontSize: 12 }}>
                        {g.name}
                      </Tag>
                    ) : null;
                  })}
                  <span className="person-count">{events.length} 个事件</span>
                </div>
                <div className="person-events">
                  {events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(event => (
                    <div
                      key={event.id}
                      className="event-card-mini"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <span className="event-year">{dayjs(event.startDate).format('YYYY年M月')}</span>
                      <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 12 }}>
                        {event.eventType}
                      </Tag>
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 事件详情抽屉 */}
      <Drawer
        title={selectedEvent?.title}
        placement="right"
        width={500}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      >
        {selectedEvent && (
          <div className="event-detail">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="时间">
                {dayjs(selectedEvent.startDate).format('YYYY年M月D日')}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={EVENT_TYPE_COLORS[selectedEvent.eventType]}>
                  {selectedEvent.eventType}
                </Tag>
              </Descriptions.Item>
              {selectedEvent.location && (
                <Descriptions.Item label="地点">{selectedEvent.location}</Descriptions.Item>
              )}
              <Descriptions.Item label="概述">{selectedEvent.summary}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 16 }}>详细内容</Title>
            <Descriptions column={1} size="small">
              {selectedEvent.detail?.motive && (
                <Descriptions.Item label="动机">{selectedEvent.detail.motive}</Descriptions.Item>
              )}
              {selectedEvent.detail?.process && (
                <Descriptions.Item label="经过">{selectedEvent.detail.process}</Descriptions.Item>
              )}
              {selectedEvent.detail?.result && (
                <Descriptions.Item label="结果">{selectedEvent.detail.result}</Descriptions.Item>
              )}
              {selectedEvent.detail?.impact && (
                <Descriptions.Item label="影响">{selectedEvent.detail.impact}</Descriptions.Item>
              )}
            </Descriptions>

            <Title level={5} style={{ marginTop: 16 }}>参与人物</Title>
            <div className="person-list">
              {getEventPersons(selectedEvent).map(person => (
                <div key={person.id} className="person-item">
                  <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <span className="person-name">{person.name}</span>
                  {getPersonGroups(person).map(g => (
                    <Tag key={g.id} color={GROUP_COLORS[g.name]} style={{ marginLeft: 8 }}>
                      {g.name}
                    </Tag>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
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
import { getDetailContent, getDetailSourceTitles } from '../../utils/sourceRegistry';

const { Title } = Typography;

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

// 统一获取 ID（兼容 _id 和 id）
const getId = (obj: any): string => String(obj._id ?? obj.id ?? '');

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

  // 加载人物和群体元数据
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

  // 构建 API 查询参数
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

  // 矩阵视图：加载全部事件
  const [matrixEvents, setMatrixEvents] = useState<Event[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  useEffect(() => {
    if (viewMode !== 'matrix-group' && viewMode !== 'matrix-person') return;
    loadMatrixEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, startYear, endYear, searchText, eventTypeFilter, groupFilter]);

  const loadMatrixEvents = async () => {
    setMatrixLoading(true);
    try {
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
    deps: [startYear, endYear, searchText, eventTypeFilter, groupFilter],
  });

  // 无限滚动处理
  const handleScroll = useCallback(() => {
    if (viewMode === 'matrix-group' || viewMode === 'matrix-person') return;
    const container = scrollContainerRef.current;
    if (!container || !hasMore || listLoading) return;

    const threshold = 200;
    if (container.scrollHeight - container.scrollTop - container.clientHeight < threshold) {
      loadMore();
    }
  }, [viewMode, hasMore, listLoading, loadMore]);

  // 切换视图模式时重置列表
  useEffect(() => {
    resetList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // 根据年份获取所属时期
  const getPeriodByYear = (year: number): typeof HISTORICAL_PERIODS[0] | undefined => {
    return HISTORICAL_PERIODS.find(p => year >= p.startYear && year <= p.endYear);
  };

  // 按群体和人物筛选事件
  const filterEventsByGroupAndPerson = (events: Event[]) => {
    return events.filter(e => {
      if (groupFilter.length > 0) {
        const eventPersonIds = e.personIds || [];
        const eventPersons = persons.filter(p => eventPersonIds.includes(getId(p)));
        const eventGroupIds = eventPersons.flatMap((p: any) => p.groupIds || []);
        if (!eventGroupIds.some((gid: any) => groupFilter.includes(String(gid)))) {
          return false;
        }
      }
      return true;
    });
  };

  // 矩阵数据（时间×群体）
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
        const groupPersonIds = groupPersons.map((p: any) => getId(p));
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

  // 矩阵数据（时间×人物）
  const matrixByYearPerson = useMemo(() => {
    const rows: any[] = [];
    const yearsWithEvents = new Set<number>();
    matrixEvents.forEach(e => yearsWithEvents.add(new Date(e.startDate).getFullYear()));
    const sortedYears = Array.from(yearsWithEvents).sort((a, b) => a - b);

    const involvedPersonIds = new Set<string>();
    matrixEvents.forEach(e => e.personIds?.forEach(pid => involvedPersonIds.add(String(pid))));
    const involvedPersons = persons.filter(p => involvedPersonIds.has(getId(p))).slice(0, 30);

    sortedYears.forEach(year => {
      const period = getPeriodByYear(year);
      const rowData: any = { key: year, year, period };
      involvedPersons.forEach(person => {
        const yearEvents = matrixEvents.filter(e => {
          const eventYear = new Date(e.startDate).getFullYear();
          return eventYear === year && e.personIds?.includes(getId(person));
        });
        if (yearEvents.length > 0) rowData[getId(person)] = yearEvents;
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
      const eventPersons = persons.filter(p => eventPersonIds.includes(getId(p)));
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
          const person = persons.find(p => getId(p) === key);
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
        const eventPersons = persons.filter(p => e.personIds?.includes(getId(p)));
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
                  <Tooltip key={getId(e)} title={`${e.title}\n${dayjs(e.startDate).format('M月D日')}`}>
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
        .filter(p => involvedPersonIds.has(getId(p)))
        .slice(0, 30)
        .map(person => {
          const personGroups = groups.filter((g: any) => person.groupIds?.includes(g.id));
          return {
            title: <Tooltip title={personGroups.map((g: any) => g.name).join('、')}><span style={{ fontWeight: 500 }}>{person.name}</span></Tooltip>,
            dataIndex: getId(person),
            key: getId(person),
            width: 100,
            render: (events: Event[] | undefined) => {
              if (!events || events.length === 0) return null;
              return (
                <div className="matrix-cell">
                  {events.map(e => (
                    <Tooltip key={getId(e)} title={`${e.title}\n${dayjs(e.startDate).format('M月D日')}`}>
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
    return persons.filter(p => event.personIds?.includes(getId(p)));
  };

  // 获取人物的群体
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
      {isMobile && (
        <div className="mobile-header-toggle">
          <Button type="text" icon={headerExpanded ? <CloseOutlined /> : <MenuOutlined />}
            onClick={() => setHeaderExpanded(!headerExpanded)} style={{ fontSize: 18 }} />
          <span className="mobile-title">中国近代史时间轴</span>
        </div>
      )}

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
                        <div key={getId(event)} className="event-card-mini" onClick={() => setSelectedEvent(event)}>
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
                  <div key={getId(person)} className="person-section">
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
                        <div key={getId(event)} className="event-card-mini" onClick={() => setSelectedEvent(event)}>
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
            {listLoading && (
              <div className="loading-indicator"><Spin tip="加载更多..." /></div>
            )}
            {!hasMore && listEvents.length > 0 && (
              <div className="no-more">— 已加载全部 {listTotal} 个事件 —</div>
            )}
          </>
        ) : null}
      </div>

      <Drawer title={selectedEvent?.title} placement="right" width={500}
        open={!!selectedEvent} onClose={() => setSelectedEvent(null)}
        extra={
          <Link to={`/event/${selectedEvent ? getId(selectedEvent) : ''}`}>
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
              {getDetailContent(selectedEvent.detail?.motive) && (
                <Descriptions.Item label="动机">
                  {getDetailContent(selectedEvent.detail?.motive)}
                  {getDetailSourceTitles(selectedEvent.detail?.motive).map(s => (
                    <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                  ))}
                </Descriptions.Item>
              )}
              {getDetailContent(selectedEvent.detail?.process) && (
                <Descriptions.Item label="经过">
                  {getDetailContent(selectedEvent.detail?.process)}
                  {getDetailSourceTitles(selectedEvent.detail?.process).map(s => (
                    <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                  ))}
                </Descriptions.Item>
              )}
              {getDetailContent(selectedEvent.detail?.result) && (
                <Descriptions.Item label="结果">
                  {getDetailContent(selectedEvent.detail?.result)}
                  {getDetailSourceTitles(selectedEvent.detail?.result).map(s => (
                    <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                  ))}
                </Descriptions.Item>
              )}
              {getDetailContent(selectedEvent.detail?.impact) && (
                <Descriptions.Item label="影响">
                  {getDetailContent(selectedEvent.detail?.impact)}
                  {getDetailSourceTitles(selectedEvent.detail?.impact).map(s => (
                    <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                  ))}
                </Descriptions.Item>
              )}
            </Descriptions>
            <Title level={5} style={{ marginTop: 16 }}>参与人物</Title>
            <div className="person-list">
              {getEventPersons(selectedEvent).map(person => (
                <div key={getId(person)} className="person-item">
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

      <Drawer title={`${selectedYear}年事件列表`} placement="right" width={400}
        open={!!selectedYear} onClose={() => setSelectedYear(null)}>
        {selectedYear && (
          <div className="year-event-list">
            {(viewMode === 'matrix-group' || viewMode === 'matrix-person' ? matrixEvents : listEvents)
              .filter(e => new Date(e.startDate).getFullYear() === selectedYear)
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map(event => (
                <div key={getId(event)} className="year-event-item"
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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Select, Tag, Drawer, Descriptions, Typography, Button, Tooltip, Empty, Table, Spin, Modal } from 'antd';
import { SearchOutlined, CalendarOutlined, UserOutlined, TeamOutlined, MenuOutlined, CloseOutlined, ExperimentOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './index.css';
import { eventService } from '../../services/eventService';
import { personService } from '../../services/personService';
import { groupService } from '../../services/groupService';
import { sourceService } from '../../services/sourceService';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { Event, SourceEntry } from '../../types/event';
import { getDetailContent, getSourceTitles } from '../../utils/sourceRegistry';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, getId, extractSourceTitles } from '../../constants';

const { Title } = Typography;

const HISTORICAL_PERIODS = [
  { key: '01', name: '鸦片战争时期', years: '1839-1860', startYear: 1839, endYear: 1860, color: '#8b5e3c', description: '林则徐禁烟、鸦片战争、南京条约、太平天国、第二次鸦片战争' },
  { key: '02', name: '洋务运动时期', years: '1861-1894', startYear: 1861, endYear: 1894, color: '#5c7a5c', description: '总理衙门设立、洋务运动推行、江南制造总局、中法战争、甲午战争爆发' },
  { key: '03', name: '甲午战后时期', years: '1895-1900', startYear: 1895, endYear: 1900, color: '#8b6e4a', description: '马关条约、戊戌变法、义和团运动、八国联军、辛丑条约' },
  { key: '04', name: '清末新政时期', years: '1901-1911', startYear: 1901, endYear: 1911, color: '#6b7a5c', description: '清末新政、废除科举、预备立宪、徐锡麟起义、辛亥革命' },
  { key: '05', name: '民国初期', years: '1912-1926', startYear: 1912, endYear: 1926, color: '#7a5c6b', description: '民国成立、袁世凯称帝、五四运动、中共成立、北伐战争' },
  { key: '06', name: '国民政府时期', years: '1927-1949', startYear: 1927, endYear: 1949, color: '#5c6b7a', description: '中原大战、长征、遵义会议、西安事变、抗日战争、解放战争' },
];

// 群体色 — 独立色板（中低饱和，与事件类型/时期完全不重叠）
const GROUP_COLORS: Record<string, string> = {
  '洋务派': '#3a7ca5',   // 海蓝
  '清廷': '#cc8a30',     // 赭橙
  '太平天国': '#d84315', // 赤陶
  '湘淮系': '#5a8a3c',   // 橄榄青
  '维新派': '#6b8cae',   // 灰蓝
  '革命派': '#b5533a',   // 铁锈红
  '中国共产党': '#a52040', // 酒红
  '英军': '#546e7a',     // 蓝灰
  '国民党': '#cc9933',   // 焦糖
  '日本侵略军': '#5c5c6e', // 铅灰
  '东北军': '#8a6d53',   // 深棕褐
  '西北军': '#9c8c6c',   // 土黄
};

export default function TimelinePage() {
  const [persons, setPersons] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sources, setSources] = useState<SourceEntry[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [startYear, setStartYear] = useState(1839);
  const [endYear, setEndYear] = useState(1949);
  const [eventTypeFilter, setEventTypeFilter] = useState<number[]>([]);
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'matrix-group' | 'matrix-person' | 'group' | 'person'>('matrix-group');
  const [showSubEvents, setShowSubEvents] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);

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

  // 加载人物、群体和来源元数据
  useEffect(() => {
    loadMeta();
  }, []);

  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const [personsRes, groupsRes, sourcesRes] = await Promise.all([
        personService.list(),
        groupService.list(),
        sourceService.list(),
      ]);
      setPersons(personsRes);
      setGroups(groupsRes);
      setSources(sourcesRes);
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
    if (showSubEvents) params.eventLevel = undefined; // 不限制层级，返回全部
    else params.eventLevel = 0; // 默认只显示主事件
    return params;
  }, [startYear, endYear, searchText, eventTypeFilter, groupFilter, showSubEvents]);

  // 矩阵视图：按年份范围分批加载
  const [matrixEvents, setMatrixEvents] = useState<Event[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [loadedYearRange, setLoadedYearRange] = useState<[number, number] | null>(null);
  const matrixTableRef = useRef<HTMLDivElement>(null);
  const matrixLoadingRef = useRef(false);
  const MATRIX_YEARS_PER_BATCH = 15;

  // 计算当前已加载到的年份
  const nextBatchStartYear = useMemo(() => {
    if (!loadedYearRange) return startYear;
    return Math.min(loadedYearRange[1] + 1, endYear);
  }, [loadedYearRange, startYear, endYear]);

  const hasMoreMatrix = useMemo(() => {
    if (!loadedYearRange) return true;
    return loadedYearRange[1] < endYear;
  }, [loadedYearRange, endYear]);

  const loadMatrixBatch = useCallback(async (fromYear: number, replace = false) => {
    if (matrixLoadingRef.current) return;
    matrixLoadingRef.current = true;
    setMatrixLoading(true);
    const toYear = Math.min(fromYear + MATRIX_YEARS_PER_BATCH - 1, endYear);
    try {
      const result = await eventService.list({
        ...buildQueryParams(),
        startYear: fromYear,
        endYear: toYear,
        page: 1,
        pageSize: 10000,
      });
      setMatrixEvents(prev => {
        if (replace) return result.data;
        const existingIds = new Set(prev.map(e => getId(e)));
        const newEvents = result.data.filter(e => !existingIds.has(getId(e)));
        return [...prev, ...newEvents];
      });
      setLoadedYearRange([fromYear, toYear]);
    } catch (e) {
      console.error(e);
    }
    matrixLoadingRef.current = false;
    setMatrixLoading(false);
  }, [buildQueryParams, endYear]);

  // 参数变化时重置并加载第一批
  useEffect(() => {
    if (viewMode !== 'matrix-group' && viewMode !== 'matrix-person') return;
    setMatrixEvents([]);
    setLoadedYearRange(null);
    matrixLoadingRef.current = false;
    loadMatrixBatch(startYear, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, startYear, endYear, searchText, eventTypeFilter, groupFilter, showSubEvents]);

  // 矩阵表格滚动监听 — 接近底部时加载下一批
  useEffect(() => {
    if (viewMode !== 'matrix-group' && viewMode !== 'matrix-person') return;
    if (!hasMoreMatrix) return;

    const container = matrixTableRef.current;
    if (!container) return;
    const scrollBody = container.querySelector('.ant-table-body');
    if (!scrollBody) return;

    const onScroll = () => {
      if (matrixLoadingRef.current) return;
      const threshold = 300;
      if (scrollBody.scrollHeight - scrollBody.scrollTop - scrollBody.clientHeight < threshold) {
        loadMatrixBatch(nextBatchStartYear);
      }
    };

    scrollBody.addEventListener('scroll', onScroll);
    return () => scrollBody.removeEventListener('scroll', onScroll);
  }, [viewMode, hasMoreMatrix, nextBatchStartYear, loadMatrixBatch]);

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
    deps: [startYear, endYear, searchText, eventTypeFilter, groupFilter, showSubEvents],
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
          const eventPersonIds = (e.personIds || []).map((pid: any) => getId(pid));
          return eventYear === year && eventPersonIds.some(pid => groupPersonIds.includes(pid));
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
    matrixEvents.forEach(e => (e.personIds || []).forEach((pid: any) => involvedPersonIds.add(getId(pid))));
    const involvedPersons = persons.filter(p => involvedPersonIds.has(getId(p))).slice(0, 30);

    sortedYears.forEach(year => {
      const period = getPeriodByYear(year);
      const rowData: any = { key: year, year, period };
      involvedPersons.forEach(person => {
        const yearEvents = matrixEvents.filter(e => {
          const eventYear = new Date(e.startDate).getFullYear();
          const eventPersonIds = (e.personIds || []).map((pid: any) => getId(pid));
          return eventYear === year && eventPersonIds.includes(getId(person));
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
        style: { position: 'sticky', left: 40, zIndex: 9, background: 'rgba(255, 252, 245, 0.98)' }
      })
    };

    let cols: any[] = [];
    if (viewMode === 'matrix-group') {
      const groupIdsWithEvents = new Set<string>();
      matrixEvents.forEach(e => {
        const eventPersonIds = (e.personIds || []).map((pid: any) => getId(pid));
        const eventPersons = persons.filter(p => eventPersonIds.includes(getId(p)));
        eventPersons.forEach((p: any) => (p.groupIds || []).forEach((gid: any) => groupIdsWithEvents.add(String(gid))));
      });
      cols = groups
        .filter(g => groupIdsWithEvents.has(String(g.id)))
        .map(group => ({
          title: <Tag color={GROUP_COLORS[group.name] || '#666'} style={{ fontSize: 12, margin: 0 }}>{group.name}</Tag>,
          dataIndex: group.id,
          key: group.id,
          width: 120,
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
            title: <Tooltip title={personGroups.map((g: any) => g.name).join('、')}><span style={{ fontWeight: 500, fontSize: 12 }}>{person.name}</span></Tooltip>,
            dataIndex: getId(person),
            key: getId(person),
            width: 90,
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
    return Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => ({
      label,
      value: Number(val),
    }));
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

  const viewModeOptions = [
    { label: '时间×群体', value: 'matrix-group', icon: <CalendarOutlined /> },
    { label: '时间×人物', value: 'matrix-person', icon: <UserOutlined /> },
    { label: '按群体', value: 'group', icon: <TeamOutlined /> },
    { label: '按人物', value: 'person', icon: <UserOutlined /> },
  ];

  const eventCountText = (viewMode === 'matrix-group' || viewMode === 'matrix-person')
    ? `共 ${matrixEvents.length} 个事件`
    : `已加载 ${listEvents.length} / ${listTotal} 个`;

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
        <>
          {(!isMobile && filterCollapsed) ? (
            <div className="filter-collapsed-bar">
              <span className="filter-summary">
                {searchText && `搜索: "${searchText}"`}
                {searchText && (startYear !== 1839 || endYear !== 1949) && ' · '}
                {startYear !== 1839 || endYear !== 1949 ? `${startYear}-${endYear}` : '1839-1949'}
                {selectedPeriod && ` · ${HISTORICAL_PERIODS.find(p => p.key === selectedPeriod)?.name}`}
                {eventTypeFilter.length > 0 && ` · ${eventTypeFilter.map(t => EVENT_TYPE_LABELS[t]).join('、')}`}
                {groupFilter.length > 0 && ` · ${groupFilter.map(gid => groups.find(g => String(g.id) === String(gid))?.name).join('、')}`}
              </span>
              <Button type="text" size="small" icon={<MenuOutlined />}
                onClick={() => setFilterCollapsed(false)} title="展开筛选" />
            </div>
          ) : (
            <div className="filter-bar">
              {/* 顶部：时期印章 + 操作按钮 */}
              <div className="filter-top-row">
                {HISTORICAL_PERIODS.map(period => (
                  <Tooltip key={period.key} title={`${period.years}: ${period.description}`}>
                    <div
                      className={`seal-chip ${selectedPeriod === period.key ? 'seal-active' : ''}`}
                      style={{
                        borderColor: selectedPeriod === period.key ? period.color : `${period.color}40`,
                        color: selectedPeriod === period.key ? period.color : `${period.color}99`,
                        backgroundColor: selectedPeriod === period.key ? `${period.color}12` : 'transparent',
                      }}
                      onClick={() => setSelectedPeriod(selectedPeriod === period.key ? null : period.key)}
                    >
                      <span className="seal-name">{period.name}</span>
                      <span className="seal-years">{period.years}</span>
                    </div>
                  </Tooltip>
                ))}
                <div className="filter-top-actions">
                  <Tooltip title="配色说明">
                    <Button type="text" size="small" icon={<QuestionCircleOutlined />}
                      onClick={() => setLegendVisible(true)} className="top-action-btn" />
                  </Tooltip>
                  {!isMobile && (
                    <Button type="text" size="small" icon={<CloseOutlined />}
                      onClick={() => setFilterCollapsed(true)} className="top-action-btn" title="收起筛选" />
                  )}
                </div>
              </div>

              {/* 主筛选行 */}
              <div className="filter-controls-row">
                <div className="filter-controls-left">
                  {/* 搜索 */}
                  <div className="filter-search-box">
                    <SearchOutlined className="filter-search-icon" />
                    <input
                      className="filter-search-input"
                      placeholder="检索事件…"
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                    />
                    {searchText && (
                      <CloseOutlined
                        className="filter-search-clear"
                        onClick={() => setSearchText('')}
                      />
                    )}
                  </div>
                  {/* 年份 */}
                  <div className="filter-years">
                    <Select
                      value={startYear}
                      onChange={(v) => { setStartYear(v); setSelectedPeriod(null); }}
                      options={yearOptions}
                      className="filter-year-select"
                      suffixIcon={null}
                      bordered={false}
                    />
                    <span className="year-dash">—</span>
                    <Select
                      value={endYear}
                      onChange={(v) => { setEndYear(v); setSelectedPeriod(null); }}
                      options={yearOptions}
                      className="filter-year-select"
                      suffixIcon={null}
                      bordered={false}
                    />
                  </div>
                  {/* 事件类型 */}
                  <Select
                    mode="multiple"
                    placeholder="事件类型"
                    value={eventTypeFilter}
                    onChange={setEventTypeFilter}
                    options={eventTypeOptions}
                    allowClear
                    maxTagCount={2}
                    className="filter-multi-select"
                  />
                  {/* 群体 */}
                  <Select
                    mode="multiple"
                    placeholder="所属群体"
                    value={groupFilter}
                    onChange={setGroupFilter}
                    options={groupOptions}
                    allowClear
                    maxTagCount={2}
                    className="filter-multi-select"
                  />
                  {/* 子事件 */}
                  <Button
                    type={showSubEvents ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setShowSubEvents(!showSubEvents)}
                    className="filter-sub-btn"
                  >
                    {showSubEvents ? '含子事件' : '仅主事件'}
                  </Button>
                </div>
                <div className="filter-controls-right">
                  {/* 计数 */}
                  <span className="filter-count">{eventCountText}</span>
                  {/* 视图切换 */}
                  <div className="filter-view-tabs">
                    {viewModeOptions.map(opt => (
                      <button
                        key={opt.value}
                        className={`view-tab-item ${viewMode === opt.value ? 'view-tab-active' : ''}`}
                        onClick={() => setViewMode(opt.value as any)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="timeline-content" ref={scrollContainerRef} onScroll={handleScroll}>
        {loadingMeta ? (
          <div className="loading-center"><Spin tip="加载中..." /></div>
        ) : (viewMode === 'matrix-group' || viewMode === 'matrix-person') ? (
          matrixEvents.length === 0 && matrixLoading ? (
            <div className="loading-center"><Spin tip="加载事件中..." /></div>
          ) : matrixDataSource.length === 0 ? (
            <Empty description="没有找到匹配的事件" />
          ) : (
            <div className="matrix-table-wrapper" ref={matrixTableRef}>
              <Table columns={matrixColumns} dataSource={matrixDataSource}
                scroll={{ x: 'max-content', y: 'calc(100vh - 200px)' }} bordered size="small" pagination={false} />
              {matrixLoading && matrixEvents.length > 0 && (
                <div className="loading-indicator"><Spin tip="加载更多..." /></div>
              )}
              {!hasMoreMatrix && (
                <div className="no-more">— 已加载全部 {matrixEvents.length} 个事件 —</div>
              )}
            </div>
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
                        <div key={getId(event)} className={`event-card-mini${event.eventLevel ? ' sub-event' : ''}`} style={{ '--event-color': EVENT_TYPE_COLORS[event.eventType] || '#666' } as React.CSSProperties} onClick={() => setSelectedEvent(event)}>
                          <span className="event-year">{dayjs(event.startDate).format('YYYY年M月')}</span>
                    <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 12 }}>{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</Tag>
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
                        <div key={getId(event)} className={`event-card-mini${event.eventLevel ? ' sub-event' : ''}`} style={{ '--event-color': EVENT_TYPE_COLORS[event.eventType] || '#666' } as React.CSSProperties} onClick={() => setSelectedEvent(event)}>
                          <span className="event-year">{dayjs(event.startDate).format('YYYY年M月')}</span>
                    <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 12 }}>{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</Tag>
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
              <Descriptions.Item label="类型"><Tag color={EVENT_TYPE_COLORS[selectedEvent.eventType]}>{EVENT_TYPE_LABELS[selectedEvent.eventType]}</Tag></Descriptions.Item>
              {selectedEvent.location && <Descriptions.Item label="地点">{selectedEvent.location}</Descriptions.Item>}
              <Descriptions.Item label="概述">{selectedEvent.summary}</Descriptions.Item>
            </Descriptions>
            <Title level={5} style={{ marginTop: 16 }}>详细内容</Title>
            <Descriptions column={1} size="small">
              {getDetailContent(selectedEvent.detail?.motive) && (
                <Descriptions.Item label="动机">
                  {getDetailContent(selectedEvent.detail?.motive)}
                  {extractSourceTitles(selectedEvent.detail?.motive).map(s => (
                    <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                  ))}
                </Descriptions.Item>
              )}
              {getDetailContent(selectedEvent.detail?.process) && (
                <Descriptions.Item label="经过">
                  {getDetailContent(selectedEvent.detail?.process)}
                  {extractSourceTitles(selectedEvent.detail?.process).map(s => (
                    <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                  ))}
                </Descriptions.Item>
              )}
              {getDetailContent(selectedEvent.detail?.result) && (
                <Descriptions.Item label="结果">
                  {getDetailContent(selectedEvent.detail?.result)}
                  {extractSourceTitles(selectedEvent.detail?.result).map(s => (
                    <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                  ))}
                </Descriptions.Item>
              )}
              {getDetailContent(selectedEvent.detail?.impact) && (
                <Descriptions.Item label="影响">
                  {getDetailContent(selectedEvent.detail?.impact)}
                  {extractSourceTitles(selectedEvent.detail?.impact).map(s => (
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
                  <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 12 }}>{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</Tag>
                  <div className="year-event-title">{event.title}</div>
                </div>
              ))}
          </div>
        )}
      </Drawer>

      <Modal title="配色说明" open={legendVisible} onCancel={() => setLegendVisible(false)}
        footer={null} width={400}>
        <div className="legend-modal-content">
          <div className="legend-block">
            <span className="legend-block-title">事件类型</span>
            <div className="legend-tags">
              {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
                <Tag key={val} color={EVENT_TYPE_COLORS[Number(val)]}>{label}</Tag>
              ))}
            </div>
          </div>
          <div className="legend-block">
            <span className="legend-block-title">历史时期</span>
            <div className="legend-tags">
              {HISTORICAL_PERIODS.map(period => (
                <Tag key={period.key} color={period.color}>{period.name} ({period.years})</Tag>
              ))}
            </div>
          </div>
          <div className="legend-block">
            <span className="legend-block-title">群体</span>
            <div className="legend-tags">
              {Object.entries(GROUP_COLORS).map(([name, color]) => (
                <Tag key={name} color={color}>{name}</Tag>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

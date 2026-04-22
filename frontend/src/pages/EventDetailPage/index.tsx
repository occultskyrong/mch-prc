import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Spin, Tag, Progress, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './index.css';
import { eventService } from '../../services/eventService';
import { personService } from '../../services/personService';
import { sourceService } from '../../services/sourceService';
import { Event, SourceEntry } from '../../types/event';
import { DIMENSION_LABELS } from '../../utils/impactFactor';
import { getDetailContent, getSourceTitles } from '../../utils/sourceRegistry';

const { Title } = Typography;

const EVENT_TYPE_LABELS: Record<number, string> = {
  1: '战争', 2: '条约', 3: '起义', 4: '改革', 5: '事件',
};

const EVENT_TYPE_COLORS: Record<number, string> = {
  1: '#c41e3a',  // 朱砂（战争）
  2: '#1a3a5c',  // 墨蓝（条约）
  3: '#b8860b',  // 暗金（起义）
  4: '#2e7d32',  // 深绿（改革）
  5: '#6a1b9a',  // 深紫（事件）
};

export default function EventDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [persons, setPersons] = useState<any[]>([]);
  const [sources, setSources] = useState<SourceEntry[]>([]);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (eventId: string) => {
    try {
      const [eventData, personsList, sourcesList] = await Promise.all([
        eventService.findById(eventId),
        personService.list(),
        sourceService.list(),
      ]);
      if (eventData) {
        setEvent(eventData);
        setPersons(personsList);
        setSources(sourcesList);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const eventPersons = event?.personIds ? persons.filter(p => event!.personIds!.includes(p._id ?? String(p.id))) : [];

  const getDetailSourceTitles = (field: any): string[] => {
    const ids = !field || typeof field === 'string' ? [] : (field.sourceIds || []);
    return getSourceTitles(ids, sources);
  };

  if (loading) return <div className="loading-placeholder"><Spin tip="加载中..." /></div>;
  if (!event) return <div className="loading-placeholder">未找到事件</div>;

  const impact = event.impactFactor;
  if (!impact || !impact.dimensions) return <div className="loading-placeholder">缺少影响力数据</div>;

  const d = impact.dimensions;
  const dimEntries = Object.entries(d) as [string, { score: number; rationale: string }][];
  const sortedDims = [...dimEntries].sort((a, b) => b[1].score - a[1].score);

  return (
    <div className="event-detail-page">
      <Link to="/timeline" className="detail-back">
        <ArrowLeftOutlined /> 返回时间轴
      </Link>

      <Title level={2} className="detail-title">{event.title}</Title>
      <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} className="detail-type-tag">
        {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
      </Tag>

      <Card title="基本信息" className="archive-card" size="small">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="时间">
            {new Date(event.startDate).toLocaleDateString('zh-CN')}
            {event.endDate && ` ~ ${new Date(event.endDate).toLocaleDateString('zh-CN')}`}
          </Descriptions.Item>
          {event.location && <Descriptions.Item label="地点">{event.location}</Descriptions.Item>}
          <Descriptions.Item label="概述" span={2}>{event.summary}</Descriptions.Item>
        </Descriptions>
        {eventPersons.length > 0 && (
          <div className="detail-persons">
            <span className="detail-persons-label">参与人物：</span>
            {eventPersons.map(p => (
              <Tag key={p._id} color="blue">{p.name}</Tag>
            ))}
          </div>
        )}
      </Card>

      <Card title="史观影响力因子" className="archive-card archive-card-impact" size="small">
        <div className="impact-summary">
          <div className="impact-score">
            <Progress
              type="circle"
              percent={Math.round(impact.finalScore / 10)}
              format={() => `${impact.finalScore}`}
              strokeWidth={6}
              size={90}
              strokeColor={{ '0%': '#c41e3a', '100%': '#b8943e' }}
            />
            <div className="impact-score-label">/ 1000</div>
          </div>
          <div className="impact-breakdown">
            <div className="impact-row">
              <span className="impact-label">基础分：</span>
              <span className="impact-value">{impact.weightedSum}</span>
              <span className="impact-label">范围加成：</span>
              <span className={`impact-value ${impact.scopeBonus > 0 ? 'positive' : ''}`}>+{impact.scopeBonus}</span>
              <span className="impact-label">持续加成：</span>
              <span className={`impact-value ${impact.durationBonus > 0 ? 'positive' : ''}`}>+{impact.durationBonus}</span>
            </div>
            <div className="impact-top-dims">
              最高维度：{sortedDims.slice(0, 3).map(([key, val]) => `${DIMENSION_LABELS[key]}(${val.score})`).join('、')}
            </div>
          </div>
        </div>

        <div className="impact-dimensions">
          {DIMENSION_TABLE_ORDER.map(key => {
            const val = d[key];
            if (!val) return null;
            return (
              <div key={key} className="impact-dim-row">
                <span className="impact-dim-label">{DIMENSION_LABELS[key]}</span>
                <Progress
                  percent={val.score * 10}
                  size="small"
                  strokeColor={getScoreColor(val.score)}
                  showInfo={false}
                  className="impact-dim-bar"
                />
                <span className="impact-dim-score">{val.score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {event.detail && (getDetailContent(event.detail.motive) || getDetailContent(event.detail.process) || getDetailContent(event.detail.result) || getDetailContent(event.detail.impact)) && (
        <Card title="详细内容" className="archive-card" size="small">
          <Descriptions column={1} size="small">
            {getDetailContent(event.detail.motive) && (
              <Descriptions.Item label="动机">
                {getDetailContent(event.detail.motive)}
                {getDetailSourceTitles(event.detail.motive).map(s => (
                  <Tag key={s} color="blue" className="source-tag">{s}</Tag>
                ))}
              </Descriptions.Item>
            )}
            {getDetailContent(event.detail.process) && (
              <Descriptions.Item label="经过">
                {getDetailContent(event.detail.process)}
                {getDetailSourceTitles(event.detail.process).map(s => (
                  <Tag key={s} color="blue" className="source-tag">{s}</Tag>
                ))}
              </Descriptions.Item>
            )}
            {getDetailContent(event.detail.result) && (
              <Descriptions.Item label="结果">
                {getDetailContent(event.detail.result)}
                {getDetailSourceTitles(event.detail.result).map(s => (
                  <Tag key={s} color="blue" className="source-tag">{s}</Tag>
                ))}
              </Descriptions.Item>
            )}
            {getDetailContent(event.detail.impact) && (
              <Descriptions.Item label="影响">
                {getDetailContent(event.detail.impact)}
                {getDetailSourceTitles(event.detail.impact).map(s => (
                  <Tag key={s} color="blue" className="source-tag">{s}</Tag>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {event.subEvents && event.subEvents.length > 0 && (
        <Card title={`子事件（${event.subEvents.length}）`} className="archive-card" size="small">
          <div className="subevents-list">
            {event.subEvents.map(sub => (
              <Link key={sub._id} to={`/event/${sub._id}`} className="subevent-link">
                <Tag color={EVENT_TYPE_COLORS[sub.eventType] || '#666'} className="subevent-type-tag">
                  {EVENT_TYPE_LABELS[sub.eventType] || sub.eventType}
                </Tag>
                <span className="subevent-date">
                  {dayjs(sub.startDate).format('YYYY年M月D日')}
                </span>
                <span className="subevent-title">{sub.title}</span>
                {sub.impactFactor && (
                  <span className={`subevent-score ${sub.impactFactor.finalScore >= 80 ? 'high' : ''}`}>
                    {sub.impactFactor.finalScore}分
                  </span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

const DIMENSION_TABLE_ORDER = [
  'politicalChange', 'economicImpact', 'militaryScale', 'socialStructure',
  'ideologicalCultural', 'internationalRelations', 'territorialSovereignty',
  'institutionalLegacy', 'historicalTurningPoint',
];

function getScoreColor(score: number): string {
  if (score >= 8) return '#3d8b3d';
  if (score >= 6) return '#1a3a5c';
  if (score >= 4) return '#b8943e';
  return '#c41e3a';
}

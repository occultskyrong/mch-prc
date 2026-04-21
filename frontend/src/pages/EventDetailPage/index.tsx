import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Spin, Tag, Progress, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
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
  1: '#f5222d', 2: '#1890ff', 3: '#fa8c16', 4: '#52c41a', 5: '#722ed1',
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

  if (loading) return <div style={{ padding: 20 }}><Spin tip="加载中..." /></div>;
  if (!event) return <div style={{ padding: 20 }}>未找到事件</div>;

  const impact = event.impactFactor;
  if (!impact || !impact.dimensions) return <div style={{ padding: 20 }}>缺少影响力数据</div>;

  const d = impact.dimensions;
  const dimEntries = Object.entries(d) as [string, { score: number; rationale: string }][];
  const sortedDims = [...dimEntries].sort((a, b) => b[1].score - a[1].score);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px' }}>
      <Link to="/timeline" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 8, color: '#1890ff' }}>
        <ArrowLeftOutlined style={{ marginRight: 4 }} /> 返回时间轴
      </Link>

      <Title level={4} style={{ marginTop: 0, marginBottom: 8 }}>{event.title}</Title>
      <Tag color={EVENT_TYPE_COLORS[event.eventType] || '#666'} style={{ fontSize: 13, marginBottom: 16 }}>
        {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
      </Tag>

      <Card title="基本信息" style={{ marginBottom: 8 }} size="small">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="时间">
            {new Date(event.startDate).toLocaleDateString('zh-CN')}
            {event.endDate && ` ~ ${new Date(event.endDate).toLocaleDateString('zh-CN')}`}
          </Descriptions.Item>
          {event.location && <Descriptions.Item label="地点">{event.location}</Descriptions.Item>}
          <Descriptions.Item label="概述" span={2}>{event.summary}</Descriptions.Item>
        </Descriptions>
        {eventPersons.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 13, color: '#666', marginRight: 8 }}>参与人物：</span>
            {eventPersons.map(p => (
              <Tag key={p._id} color="blue">{p.name}</Tag>
            ))}
          </div>
        )}
      </Card>

      <Card title="史观影响力因子" style={{ marginBottom: 8 }} size="small">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={Math.round(impact.finalScore / 10)}
              format={() => `${impact.finalScore}`}
              strokeWidth={8}
              size={100}
              strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>/ 1000</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: '#666' }}>基础分：</span>
              <span style={{ fontWeight: 600 }}>{impact.weightedSum}</span>
              <span style={{ color: '#999', marginLeft: 12 }}>范围加成：</span>
              <span style={{ fontWeight: 600, color: impact.scopeBonus > 0 ? '#52c41a' : '#999' }}>+{impact.scopeBonus}</span>
              <span style={{ color: '#999', marginLeft: 12 }}>持续加成：</span>
              <span style={{ fontWeight: 600, color: impact.durationBonus > 0 ? '#52c41a' : '#999' }}>+{impact.durationBonus}</span>
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              最高维度：{sortedDims.slice(0, 3).map(([key, val]) => `${DIMENSION_LABELS[key]}(${val.score})`).join('、')}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {DIMENSION_TABLE_ORDER.map(key => {
            const val = d[key];
            if (!val) return null;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 60, fontSize: 12, textAlign: 'right', color: '#666' }}>{DIMENSION_LABELS[key]}</span>
                <Progress
                  percent={val.score * 10}
                  size="small"
                  strokeColor={getScoreColor(val.score)}
                  showInfo={false}
                  style={{ flex: 1 }}
                />
                <span style={{ width: 30, fontSize: 12, fontWeight: 600 }}>{val.score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {event.detail && (getDetailContent(event.detail.motive) || getDetailContent(event.detail.process) || getDetailContent(event.detail.result) || getDetailContent(event.detail.impact)) && (
        <Card title="详细内容" style={{ marginBottom: 8 }} size="small">
          <Descriptions column={1} size="small">
            {getDetailContent(event.detail.motive) && (
              <Descriptions.Item label="动机">
                {getDetailContent(event.detail.motive)}
                {getDetailSourceTitles(event.detail.motive).map(s => (
                  <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                ))}
              </Descriptions.Item>
            )}
            {getDetailContent(event.detail.process) && (
              <Descriptions.Item label="经过">
                {getDetailContent(event.detail.process)}
                {getDetailSourceTitles(event.detail.process).map(s => (
                  <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                ))}
              </Descriptions.Item>
            )}
            {getDetailContent(event.detail.result) && (
              <Descriptions.Item label="结果">
                {getDetailContent(event.detail.result)}
                {getDetailSourceTitles(event.detail.result).map(s => (
                  <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                ))}
              </Descriptions.Item>
            )}
            {getDetailContent(event.detail.impact) && (
              <Descriptions.Item label="影响">
                {getDetailContent(event.detail.impact)}
                {getDetailSourceTitles(event.detail.impact).map(s => (
                  <Tag key={s} color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{s}</Tag>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {event.subEvents && event.subEvents.length > 0 && (
        <Card title={`子事件（${event.subEvents.length}）`} style={{ marginBottom: 8 }} size="small">
          {event.subEvents.map(sub => (
            <Link key={sub._id} to={`/event/${sub._id}`} style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Tag color={EVENT_TYPE_COLORS[sub.eventType] || '#666'} style={{ fontSize: 11 }}>
                  {EVENT_TYPE_LABELS[sub.eventType] || sub.eventType}
                </Tag>
                <span style={{ fontSize: 12, color: '#999', minWidth: 80 }}>
                  {dayjs(sub.startDate).format('YYYY年M月D日')}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{sub.title}</span>
                {sub.impactFactor && (
                  <span style={{ fontSize: 12, color: sub.impactFactor.finalScore >= 80 ? '#52c41a' : '#999' }}>
                    {sub.impactFactor.finalScore}分
                  </span>
                )}
              </div>
            </Link>
          ))}
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
  if (score >= 8) return '#52c41a';
  if (score >= 6) return '#1890ff';
  if (score >= 4) return '#faad14';
  return '#ff4d4f';
}

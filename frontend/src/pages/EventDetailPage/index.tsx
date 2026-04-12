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
    try {
      const res = await eventService.findById(eventId);
      setEvent(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return <Spin />;
  if (!event) return <div>未找到事件</div>;

  return (
    <Card title={event.title}>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="时间">{event.startDate} ~ {event.endDate || '瞬间事件'}</Descriptions.Item>
        <Descriptions.Item label="类型"><Tag color="blue">{event.eventType}</Tag></Descriptions.Item>
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
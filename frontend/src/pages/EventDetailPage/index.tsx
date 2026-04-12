import { useParams } from 'react-router-dom';
import { Card, Descriptions, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { eventService } from '../../services/eventService';
import { Event } from '../../types/event';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (id) {
      loadEvent(Number(id));
    }
  }, [id]);

  const loadEvent = async (eventId: number) => {
    setLoading(true);
    try {
      const res = await eventService.findById(eventId);
      setEvent(res.data);
    } catch (e) {
      message.error('加载事件详情失败');
    }
    setLoading(false);
  };

  if (loading) {
    return <Spin />;
  }

  if (!event) {
    return <Card>事件不存在</Card>;
  }

  return (
    <Card title={event.title}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="开始时间">{event.startDate}</Descriptions.Item>
        {event.endDate && <Descriptions.Item label="结束时间">{event.endDate}</Descriptions.Item>}
        <Descriptions.Item label="事件类型">{event.eventType}</Descriptions.Item>
        {event.summary && <Descriptions.Item label="摘要">{event.summary.content}</Descriptions.Item>}
        {event.detail && (
          <>
            <Descriptions.Item label="起因">{event.detail.motive}</Descriptions.Item>
            <Descriptions.Item label="过程">{event.detail.process}</Descriptions.Item>
            <Descriptions.Item label="结果">{event.detail.result}</Descriptions.Item>
            <Descriptions.Item label="影响">{event.detail.impact}</Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Card>
  );
}
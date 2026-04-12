import { useState, useEffect } from 'react';
import { DatePicker, Select, Table, Card, Spin } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { timelineService } from '../../services/timelineService';
import { TimelineMatrix } from '../../types/timeline';

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
    try {
      const res = await timelineService.getMatrix(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
        groupBy
      );
      setMatrix(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const columns = matrix?.columns.map(year => ({
    title: year,
    dataIndex: year,
    key: year,
    width: 120,
    render: (events: any[]) => events?.map(e => (
      <div key={e.eventId} style={{ marginBottom: 4 }}>
        <Link to={`/event/${e.eventId}`}>{e.title}</Link>
      </div>
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
    <Card title="中国近代史时间轴">
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <DatePicker value={startDate} onChange={(d) => d && setStartDate(d)} picker="year" />
        <DatePicker value={endDate} onChange={(d) => d && setEndDate(d)} picker="year" />
        <Select value={groupBy} onChange={setGroupBy} options={[
          { value: 'group', label: '按群体' },
          { value: 'person', label: '按人物' },
        ]} style={{ width: 120 }} />
      </div>
      {loading ? <Spin /> : (
        <Table
          columns={[{ title: '名称', dataIndex: 'name', fixed: 'left', width: 150 }, ...columns]}
          dataSource={dataSource}
          scroll={{ x: 'max-content' }}
          bordered
          size="small"
        />
      )}
    </Card>
  );
}
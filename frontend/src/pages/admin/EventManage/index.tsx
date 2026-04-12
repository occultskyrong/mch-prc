import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Space, message } from 'antd';
import dayjs from 'dayjs';
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
    try {
      const res = await eventService.list({});
      setEvents(res.data.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async (values: any) => {
    try {
      await eventService.create({
        title: values.title,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        eventType: values.eventType,
        summaryContent: values.summaryContent,
      });
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadEvents();
    } catch (e) {
      message.error('创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await eventService.delete(id);
      message.success('删除成功');
      loadEvents();
    } catch (e) {
      message.error('删除失败');
    }
  };

  return (
    <div>
      <Button type="primary" onClick={() => setModalVisible(true)} style={{ marginBottom: 16 }}>
        新增事件
      </Button>
      <Table
        loading={loading}
        dataSource={events}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 60 },
          { title: '标题', dataIndex: 'title' },
          { title: '开始时间', dataIndex: 'startDate', width: 120 },
          { title: '类型', dataIndex: 'eventType', width: 80 },
          {
            title: '操作',
            width: 100,
            render: (r: Event) => (
              <Space>
                <Button size="small" danger onClick={() => handleDelete(r.id)}>删除</Button>
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
              { value: '其他', label: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="summaryContent" label="摘要">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
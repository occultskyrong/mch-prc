import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message } from 'antd';
import { personService } from '../../../services/personService';
import { Person } from '../../../types/person';

export default function PersonManage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadPersons(); }, []);

  const loadPersons = async () => {
    setLoading(true);
    try {
      const res = await personService.list({});
      setPersons(res.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (values: any) => {
    try {
      await personService.create(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadPersons();
    } catch (e) { message.error('创建失败'); }
  };

  return (
    <div>
      <Button type="primary" onClick={() => setModalVisible(true)} style={{ marginBottom: 16 }}>新增人物</Button>
      <Table loading={loading} dataSource={persons} columns={[
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: '姓名', dataIndex: 'name' },
        { title: '生年', dataIndex: 'birthYear', width: 80 },
        { title: '卒年', dataIndex: 'deathYear', width: 80 },
        { title: '性别', dataIndex: 'gender', width: 60 },
      ]} rowKey="id" />
      <Modal title="新增人物" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="birthYear" label="出生年份"><InputNumber /></Form.Item>
          <Form.Item name="deathYear" label="逝世年份"><InputNumber /></Form.Item>
          <Form.Item name="gender" label="性别"><Select options={[{value:'男',label:'男'}, {value:'女',label:'女'}]} /></Form.Item>
          <Form.Item name="bioSummary" label="生平简介"><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
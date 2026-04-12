import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message } from 'antd';
import { groupService } from '../../../services/groupService';
import { Group } from '../../../types/group';

export default function GroupManage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await groupService.list();
      setGroups(res.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (values: any) => {
    try {
      await groupService.create(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadGroups();
    } catch (e) { message.error('创建失败'); }
  };

  return (
    <div>
      <Button type="primary" onClick={() => setModalVisible(true)} style={{ marginBottom: 16 }}>新增群体</Button>
      <Table loading={loading} dataSource={groups} columns={[
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: '名称', dataIndex: 'name' },
        { title: '类型', dataIndex: 'type', width: 100 },
        { title: '描述', dataIndex: 'description' },
      ]} rowKey="id" />
      <Modal title="新增群体" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型"><Select options={[
            {value:'党派',label:'党派'}, {value:'军阀',label:'军阀'}, {value:'学派',label:'学派'}, {value:'其他',label:'其他'},
          ]} /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
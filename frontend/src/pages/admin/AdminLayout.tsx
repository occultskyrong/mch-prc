import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, Layout } from 'antd';

const { Sider, Content } = Layout;

export default function AdminLayout() {
  const location = useLocation();
  const selectedKey = location.pathname.split('/')[2] || 'event';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200}>
        <Menu mode="inline" selectedKeys={[selectedKey]}>
          <Menu.Item key="event"><Link to="/admin/event">事件管理</Link></Menu.Item>
          <Menu.Item key="person"><Link to="/admin/person">人物管理</Link></Menu.Item>
          <Menu.Item key="group"><Link to="/admin/group">群体管理</Link></Menu.Item>
          <Menu.Item key="source"><Link to="/admin/source">史料管理</Link></Menu.Item>
        </Menu>
      </Sider>
      <Content style={{ padding: 24, background: '#fff' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
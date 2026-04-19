import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { CalendarOutlined, ExperimentOutlined } from '@ant-design/icons';
import './index.css';

const { Header, Content } = Layout;

export default function LayoutWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/timeline', icon: <CalendarOutlined />, label: '时间轴' },
    { key: '/algorithm', icon: <ExperimentOutlined />, label: '算法说明' },
  ];

  return (
    <Layout className="layout-container" style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname === '/' ? '/timeline' : location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, border: 'none' }}
        />
      </Header>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
}
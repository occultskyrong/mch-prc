import { Outlet, Link } from 'react-router-dom';
import { Menu } from 'antd';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Menu mode="horizontal">
        <Menu.Item key="timeline"><Link to="/timeline">时间轴</Link></Menu.Item>
      </Menu>
      <div style={{ padding: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}
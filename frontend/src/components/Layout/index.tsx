import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import { CalendarOutlined, ExperimentOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import './index.css';

export default function LayoutWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { key: '/timeline', icon: <CalendarOutlined />, label: '时间轴' },
    { key: '/algorithm', icon: <ExperimentOutlined />, label: '算法说明' },
  ];

  return (
    <div className="layout-container">
      <header className="archive-header">
        <div className="archive-header-inner">
          <div className="archive-logo">
            <span className="archive-logo-cn">中国近代史</span>
            <span className="archive-logo-years">1839—1949</span>
          </div>
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="切换菜单">
            {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname === '/' ? '/timeline' : location.pathname]}
            items={menuItems}
            onClick={({ key }) => { navigate(key); setMobileMenuOpen(false); }}
            className={`archive-menu ${mobileMenuOpen ? 'menu-open' : ''}`}
          />
        </div>
      </header>
      <main className="archive-content" key={location.pathname + location.search}>
        <Outlet />
      </main>
    </div>
  );
}
import { Outlet } from 'react-router-dom';
import './index.css';

export default function Layout() {
  return (
    <div className="layout-container">
      <Outlet />
    </div>
  );
}
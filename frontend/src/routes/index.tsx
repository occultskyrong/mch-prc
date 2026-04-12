import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import TimelinePage from '../pages/TimelinePage';
import EventDetailPage from '../pages/EventDetailPage';
import AdminLayout from '../pages/admin/AdminLayout';
import EventManage from '../pages/admin/EventManage';
import PersonManage from '../pages/admin/PersonManage';
import GroupManage from '../pages/admin/GroupManage';
import SourceManage from '../pages/admin/SourceManage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <TimelinePage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'event/:id', element: <EventDetailPage /> },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { path: 'event', element: <EventManage /> },
          { path: 'person', element: <PersonManage /> },
          { path: 'group', element: <GroupManage /> },
          { path: 'source', element: <SourceManage /> },
        ],
      },
    ],
  },
]);
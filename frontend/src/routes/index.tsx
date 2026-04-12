import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import TimelinePage from '../pages/TimelinePage';
import EventDetailPage from '../pages/EventDetailPage';
import AdminLayout from '../pages/admin/AdminLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <TimelinePage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'event/:id', element: <EventDetailPage /> },
      { path: 'admin', element: <AdminLayout /> },
    ],
  },
]);
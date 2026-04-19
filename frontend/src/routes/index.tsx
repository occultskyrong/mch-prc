import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import TimelinePage from '../pages/TimelinePage';
import AlgorithmPage from '../pages/AlgorithmPage';
import EventDetailPage from '../pages/EventDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <TimelinePage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'algorithm', element: <AlgorithmPage /> },
      { path: 'event/:id', element: <EventDetailPage /> },
    ],
  },
]);
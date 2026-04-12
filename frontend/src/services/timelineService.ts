import api from './api';
import { TimelineMatrix } from '../types/timeline';

export const timelineService = {
  getMatrix: (startDate: string, endDate: string, groupBy: 'group' | 'person') =>
    api.get<TimelineMatrix>('/timeline/matrix', { params: { startDate, endDate, groupBy } }),
};
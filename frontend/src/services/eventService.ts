import api from './api';
import { Event, EventListParams } from '../types/event';

export const eventService = {
  list: (params: EventListParams) => api.get<{ data: Event[]; count: number }>('/event/list', { params }),
  findById: (id: number) => api.get<Event>(`/event/${id}`),
  create: (data: Partial<Event>) => api.post<Event>('/event', data),
  delete: (id: number) => api.delete(`/event/${id}`),
};
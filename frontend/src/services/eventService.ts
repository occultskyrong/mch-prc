import { api } from './api';
import { Event, EventListParams, PaginatedResponse } from '../types/event';

export const eventService = {
  list: async (params?: EventListParams): Promise<PaginatedResponse<Event>> => {
    return api.get<PaginatedResponse<Event>>('/events', {
      page: params?.page,
      pageSize: params?.pageSize,
      startYear: params?.startYear,
      endYear: params?.endYear,
      eventType: params?.eventType,
      search: params?.search,
    });
  },

  findById: async (id: string): Promise<Event | undefined> => {
    return api.get<Event>(`/events/${id}`);
  },
};

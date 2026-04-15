import { Event } from '../types/event';

let eventsData: Event[] = [];

async function loadData() {
  if (eventsData.length === 0) {
    const response = await fetch('/data/events.json');
    const data = await response.json();
    eventsData = data.events;
  }
  return eventsData;
}

export const eventService = {
  list: async (params?: { page?: number; pageSize?: number; title?: string }) => {
    const data = await loadData();
    let filtered = data;
    if (params?.title) {
      filtered = filtered.filter(e => e.title.includes(params.title!));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), count: filtered.length };
  },

  findById: async (id: number) => {
    const data = await loadData();
    return data.find(e => e.id === id) || null;
  },
};
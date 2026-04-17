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
    // 如果 pageSize 不指定或为 0，返回全部数据
    if (!params?.pageSize) {
      return { data: filtered, count: filtered.length };
    }
    const page = params?.page || 1;
    const pageSize = params.pageSize;
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), count: filtered.length };
  },

  findById: async (id: number) => {
    const data = await loadData();
    return data.find(e => e.id === id) || null;
  },
};
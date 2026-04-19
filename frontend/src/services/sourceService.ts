import { api } from './api';
import { SourceEntry } from '../types/event';

let cache: SourceEntry[] | null = null;

export const sourceService = {
  list: async (): Promise<SourceEntry[]> => {
    if (cache) return cache;
    const sources = await api.get<SourceEntry[]>('/sources');
    cache = sources;
    return sources;
  },

  clearCache: () => {
    cache = null;
  },
};

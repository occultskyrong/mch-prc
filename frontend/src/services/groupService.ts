import { api } from './api';

export const groupService = {
  list: async () => {
    return api.get<any[]>('/groups');
  },

  findById: async (id: string) => {
    return api.get<any>(`/groups/${id}`);
  },
};

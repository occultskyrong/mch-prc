import { api } from './api';

export const personService = {
  list: async () => {
    const res = await api.get<any>('/persons?pageSize=1000');
    return res.data || [];
  },

  findById: async (id: string) => {
    return api.get<any>(`/persons/${id}`);
  },
};

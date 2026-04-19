import { api } from './api';

export const personService = {
  list: async () => {
    return api.get<any[]>('/persons');
  },

  findById: async (id: string) => {
    return api.get<any>(`/persons/${id}`);
  },
};

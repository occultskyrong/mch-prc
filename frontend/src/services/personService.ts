import { api } from './api';

export const personService = {
  list: async () => {
    const res = await api.get<any>('/persons?pageSize=1000');
    const persons = res.data || [];
    // 后端返回 _id，前端统一使用 id
    return persons.map((p: any) => ({ ...p, id: p._id }));
  },

  findById: async (id: string) => {
    return api.get<any>(`/persons/${id}`);
  },
};

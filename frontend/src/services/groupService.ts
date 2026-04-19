import { api } from './api';

export const groupService = {
  list: async () => {
    const res = await api.get<any[]>('/groups');
    // 后端返回 _id，前端统一使用 id
    return res.map((g: any) => ({ ...g, id: g._id }));
  },

  findById: async (id: string) => {
    return api.get<any>(`/groups/${id}`);
  },
};

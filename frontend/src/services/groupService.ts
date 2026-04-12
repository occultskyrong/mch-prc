import api from './api';
import { Group } from '../types/group';

export const groupService = {
  list: () => api.get<{ data: Group[] }>('/group/list'),
  findById: (id: number) => api.get<Group>(`/group/${id}`),
  create: (data: Partial<Group>) => api.post<Group>('/group', data),
};
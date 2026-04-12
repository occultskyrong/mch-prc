import api from './api';
import { Person } from '../types/person';

export const personService = {
  list: (params?: object) => api.get<{ data: Person[] }>('/person/list', { params }),
  findById: (id: number) => api.get<Person>(`/person/${id}`),
  create: (data: Partial<Person>) => api.post<Person>('/person', data),
};
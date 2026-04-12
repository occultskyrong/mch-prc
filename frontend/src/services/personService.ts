import api from './api';
import { Person } from '../types/person';

export const personService = {
  list: () => api.get<{ data: Person[] }>('/person/list'),
  findById: (id: number) => api.get<Person>(`/person/${id}`),
  create: (data: Partial<Person>) => api.post<Person>('/person', data),
};
import { Person } from '../types/person';

let personsData: Person[] = [];

async function loadData() {
  if (personsData.length === 0) {
    const response = await fetch('/data/persons.json');
    const data = await response.json();
    personsData = data.persons;
  }
  return personsData;
}

export const personService = {
  list: async () => {
    const data = await loadData();
    return { data, count: data.length };
  },

  findById: async (id: number) => {
    const data = await loadData();
    return data.find(p => p.id === id) || null;
  },
};
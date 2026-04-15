import { Group } from '../types/group';

let groupsData: Group[] = [];

async function loadData() {
  if (groupsData.length === 0) {
    const response = await fetch('/data/groups.json');
    const data = await response.json();
    groupsData = data.groups;
  }
  return groupsData;
}

export const groupService = {
  list: async () => {
    const data = await loadData();
    return { data, count: data.length };
  },

  findById: async (id: number) => {
    const data = await loadData();
    return data.find(g => g.id === id) || null;
  },

  tree: async () => {
    const data = await loadData();
    return data.filter(g => !g.parentId);
  },
};
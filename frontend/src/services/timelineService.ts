import { TimelineMatrix, TimelineRow, TimelineEvent } from '../types/timeline';
import { eventService } from './eventService';
import { personService } from './personService';
import { groupService } from './groupService';

export const timelineService = {
  getMatrix: async (startDateStr: string, endDateStr: string, groupBy: 'group' | 'person'): Promise<{ data: TimelineMatrix }> => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // 生成时间列
    const columns: string[] = [];
    for (let year = startYear; year <= endYear; year++) {
      columns.push(String(year));
    }

    // 获取数据
    const eventsResult = await eventService.list();
    const events = eventsResult.data;

    // 获取人物和群体数据
    const personsResult = await personService.list();
    const persons = personsResult.data;

    const groupsResult = await groupService.list();
    const groups = groupsResult.data;

    // 筛选时间范围内的事件
    const filteredEvents = events.filter(e => {
      const eventStart = new Date(e.startDate);
      return eventStart >= startDate && eventStart <= endDate;
    });

    let rows: TimelineRow[] = [];

    if (groupBy === 'group') {
      rows = groups.map(group => {
        // 找到属于该群体的人物
        const groupPersons = persons.filter(p => p.groupIds?.includes(group.id));
        const groupPersonIds = groupPersons.map(p => p.id);

        // 找到这些人物参与的事件
        const groupEvents: TimelineEvent[] = [];
        filteredEvents.forEach(event => {
          if (event.personIds?.some((pid: number) => groupPersonIds.includes(pid))) {
            groupEvents.push({
              eventId: event.id,
              title: event.title,
              year: String(new Date(event.startDate).getFullYear()),
            });
          }
        });

        return {
          id: group.id,
          name: group.name,
          type: 'group',
          events: groupEvents,
        };
      });
    } else {
      // 按人物分组
      rows = persons.map(person => {
        const personEvents: TimelineEvent[] = [];
        filteredEvents.forEach(event => {
          if (event.personIds?.includes(person.id)) {
            personEvents.push({
              eventId: event.id,
              title: event.title,
              year: String(new Date(event.startDate).getFullYear()),
            });
          }
        });

        return {
          id: person.id,
          name: person.name,
          type: 'person',
          events: personEvents,
        };
      });
    }

    return { data: { columns, rows } };
  },
};
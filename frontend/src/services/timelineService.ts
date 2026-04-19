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

    const columns: string[] = [];
    for (let year = startYear; year <= endYear; year++) {
      columns.push(String(year));
    }

    const eventsResult = await eventService.list();
    const events = eventsResult.data;

    const persons = await personService.list();
    const groups = await groupService.list();

    const filteredEvents = events.filter(e => {
      const eventStart = new Date(e.startDate);
      return eventStart >= startDate && eventStart <= endDate;
    });

    let rows: TimelineRow[] = [];

    if (groupBy === 'group') {
      rows = groups.map(group => {
        const groupPersons = persons.filter((p: any) => p.groupIds?.includes(group.id));
        const groupPersonIds = groupPersons.map((p: any) => p._id ?? p.id);

        const groupEvents: TimelineEvent[] = [];
        filteredEvents.forEach(event => {
          if (event.personIds?.some((pid: string) => groupPersonIds.includes(pid))) {
            groupEvents.push({
              eventId: event._id ?? event.id ?? 0,
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
      rows = persons.map((person: any) => {
        const personEvents: TimelineEvent[] = [];
        filteredEvents.forEach(event => {
          if (event.personIds?.includes(person._id ?? person.id)) {
            personEvents.push({
              eventId: event._id ?? event.id ?? 0,
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

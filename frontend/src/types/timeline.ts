export interface TimelineMatrix {
  columns: string[];
  rows: TimelineRow[];
}

export interface TimelineRow {
  id: string | number;
  name: string;
  type: 'group' | 'person';
  events: TimelineEvent[];
}

export interface TimelineEvent {
  eventId: string | number;
  title: string;
  year: string;
}

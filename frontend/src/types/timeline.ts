export interface TimelineMatrix {
  columns: string[];
  rows: TimelineRow[];
}

export interface TimelineRow {
  id: number;
  name: string;
  type: 'group' | 'person';
  events: TimelineEvent[];
}

export interface TimelineEvent {
  eventId: number;
  title: string;
  year: string;
}
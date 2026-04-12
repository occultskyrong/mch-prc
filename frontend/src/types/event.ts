export interface Event {
  id: number;
  title: string;
  startDate: string;
  endDate?: string;
  isInstant: boolean;
  eventType: string;
  summary?: { content: string };
  detail?: { motive: string; process: string; result: string; impact: string };
}

export interface EventCreateInput {
  title: string;
  startDate: string;
  endDate?: string;
  isInstant?: boolean;
  eventType?: string;
  summaryContent?: string;
}

export interface EventListParams {
  current?: number;
  pageSize?: number;
  title?: string;
  startDate?: string;
  endDate?: string;
}
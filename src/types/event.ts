export interface Event {
  id: number;
  title: string;
  startDate: string;
  endDate?: string;
  isInstant: boolean;
  eventType: string;
  summary: string;  // 简要概述
  detail?: {
    motive: string;
    process: string;
    result: string;
    impact: string;
  };
  personIds?: number[];  // 参与人物ID
  relatedEvents?: number[];  // 关联事件ID
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
// 查询参数 DTO
export class QueryEventsDto {
  page?: number = 1;
  pageSize?: number = 10;
  year?: number;
  eventType?: string;
  groupId?: string;
  search?: string;
}

// 创建/更新事件 DTO
export class CreateEventDto {
  title: string;
  startDate: Date;
  endDate?: Date;
  eventType?: string;
  location?: string;
  summary?: string;
  detail?: {
    motive?: string;
    process?: string;
    result?: string;
    impact?: string;
  };
  impactFactor?: number;
  periodId?: string;
  personIds?: string[];
  subEvents?: {
    title: string;
    date?: Date;
    content?: string;
  }[];
  source?: string;
}
export interface DimensionScore {
  score: number;
  rationale: string;
}

export interface ImpactFactor {
  dimensions: Record<string, DimensionScore>;
  weightedSum: number;
  scopeBonus: number;
  scopeLabel: string;
  durationBonus: number;
  durationLabel: string;
  finalScore: number;
}

/** 信息来源注册表条目 */
export interface SourceEntry {
  id: number;
  alias: string;
  title: string;
  author: string | null;
  publisher: string | null;
  publishYear: number | null;
  url: string | null;
  type: '百科' | '专著' | '史料' | '论文' | '档案';
  reliability: 1 | 2 | 3;
  description: string;
}

/** 带来源标记的详情字段 */
export interface EventDetailField {
  content: string;
  /** 引用 sources.json 中的来源 ID */
  sourceIds: number[];
}

export interface EventDetail {
  motive?: EventDetailField | string;
  process?: EventDetailField | string;
  result?: EventDetailField | string;
  impact?: EventDetailField | string;
}

export interface Event {
  _id?: string;
  id?: number;
  title: string;
  startDate: string;
  endDate?: string;
  isInstant?: boolean;
  eventType: number;
  eventLevel?: number;
  location?: string;
  summary: string;
  detail?: EventDetail;
  impactFactor?: ImpactFactor;
  personIds?: string[];
  relatedEvents?: string[];
  parentEventId?: string;
  /** 子事件列表（仅主事件在详情查询时返回） */
  subEvents?: Event[];
  /** 事件整体涉及的来源 ID（替代旧的 string source 字段） */
  sourceIds?: number[];
}

export interface EventCreateInput {
  title: string;
  startDate: string;
  endDate?: string;
  isInstant?: boolean;
  eventType?: number;
  summaryContent?: string;
}

export interface EventListParams {
  page?: number;
  pageSize?: number;
  startYear?: number;
  endYear?: number;
  eventType?: number;
  eventLevel?: number;
  parentEventId?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

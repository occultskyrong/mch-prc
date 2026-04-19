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

export interface Event {
  _id?: string;
  id?: number;
  title: string;
  startDate: string;
  endDate?: string;
  isInstant?: boolean;
  eventType: string;
  location?: string;
  summary: string;
  detail?: {
    motive?: string;
    process?: string;
    result?: string;
    impact?: string;
  };
  impactFactor?: ImpactFactor;
  personIds?: string[];
  relatedEvents?: string[];
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
  page?: number;
  pageSize?: number;
  startYear?: number;
  endYear?: number;
  eventType?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
